terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = "us-east-1" # You can change this to your preferred region (e.g., us-west-2, ap-south-1)
}

# Generate a secure SSH key pair
resource "tls_private_key" "expense_tracker_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

# Create the Key Pair in AWS
resource "aws_key_pair" "expense_tracker_keypair" {
  key_name   = "expense-tracker-deploy-key"
  public_key = tls_private_key.expense_tracker_key.public_key_openssh
}

# Save the private key to your local Windows machine
resource "local_file" "private_key" {
  content  = tls_private_key.expense_tracker_key.private_key_pem
  filename = "${path.module}/expense-tracker-key.pem"
}

# Create a Security Group allowing HTTP and SSH
resource "aws_security_group" "expense_tracker_sg" {
  name        = "expense-tracker-sg"
  description = "Allow inbound SSH and HTTP"

  ingress {
    description = "SSH from anywhere"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ExpenseTracker-SG"
  }
}

# Get the latest Ubuntu 22.04 AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Create the EC2 Instance
resource "aws_instance" "expense_tracker_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro" # Change to t2.micro if your region doesn't support t3 in the free tier
  key_name      = aws_key_pair.expense_tracker_keypair.key_name

  vpc_security_group_ids = [aws_security_group.expense_tracker_sg.id]

  # User data to automatically install Docker, clone repo, and start the app
  user_data = <<-EOF
              #!/bin/bash
              set -e
              exec > /var/log/user-data.log 2>&1

              echo "=== Starting setup ==="
              apt-get update -y

              # Install Docker
              apt-get install -y apt-transport-https ca-certificates curl software-properties-common git
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
              add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
              apt-get update -y
              apt-get install -y docker-ce
              systemctl start docker
              systemctl enable docker

              # Add ubuntu user to docker group
              usermod -aG docker ubuntu

              # Install Docker Compose v2
              curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
              chmod +x /usr/local/bin/docker-compose

              echo "=== Cloning repository ==="
              cd /home/ubuntu
              git clone https://github.com/Nandha-kumar07/EXPANCE-TRACKER.git app
              chown -R ubuntu:ubuntu /home/ubuntu/app

              echo "=== Writing .env file ==="
              cat > /home/ubuntu/app/backend/.env << 'ENVEOF'
              DATABASE_URL=postgresql://postgres:Nandhakumar@07@db.vxsdmovhbmkpbdfykkqf.supabase.co:5432/postgres
              JWT_SECRET=expense_tracker_secret_key_2024
              PORT=5000
              GEMINI_API_KEY=REPLACE_WITH_YOUR_GEMINI_API_KEY
              EMAIL_USER=REPLACE_WITH_YOUR_EMAIL
              EMAIL_PASS=REPLACE_WITH_YOUR_APP_PASSWORD
              ENVEOF
              chown ubuntu:ubuntu /home/ubuntu/app/backend/.env

              echo "=== Starting Docker Compose (production) ==="
              cd /home/ubuntu/app
              sudo -u ubuntu docker-compose -f docker-compose.prod.yml up -d --build

              echo "=== Setup complete ==="
              EOF

  tags = {
    Name = "ExpenseTracker-Server"
  }
}

# Output the Public IP so you know where to connect
output "public_ip" {
  description = "The public IP address of the web server"
  value       = aws_instance.expense_tracker_server.public_ip
}

output "ssh_command" {
  description = "The command to SSH into the server"
  value       = "ssh -i expense-tracker-key.pem ubuntu@${aws_instance.expense_tracker_server.public_ip}"
}
