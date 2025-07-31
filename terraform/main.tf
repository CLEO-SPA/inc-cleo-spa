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
      version = "~> 2.4"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }
  
  # This allows Terraform to continue even if there are non-critical errors
  # such as resources that already exist
  required_version = ">= 0.13"
}

provider "aws" {
  region = var.aws_region
}

# Get available AZs
data "aws_availability_zones" "available" {
  state = "available"
}

# 1. Networking (VPC and Security Groups)
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = {
    Name = "${var.project_name}-vpc"
  }
}

resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true
  tags = {
    Name = "${var.project_name}-public-subnet-1"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true
  tags = {
    Name = "${var.project_name}-public-subnet-2"
  }
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name = "${var.project_name}-igw"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }
  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

resource "aws_security_group" "app_sg" {
  name        = "${var.project_name}-app-sg"
  description = "Allow HTTP inbound traffic"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Consider restricting this in production
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "rds_sg" {
  name        = "${var.project_name}-rds-sg"
  description = "Allow traffic from app instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432 # PostgreSQL port
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }
}

# Security group for public RDS access (only created when db_publicly_accessible = true)
resource "aws_security_group" "rds_public_sg" {
  count       = var.db_publicly_accessible ? 1 : 0
  name        = "${var.project_name}-rds-public-sg"
  description = "Allow public access to RDS"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow PostgreSQL access from anywhere"
  }
  
  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.project_name}-rds-public-sg"
  }
}

# 2. ECR Repositories
resource "aws_ecr_repository" "backend" {
  name = "${var.project_name}-backend"

  # This will prevent Terraform from failing if the repository already exists
  lifecycle {
    ignore_changes = [name]
    prevent_destroy = true
  }
}

resource "aws_ecr_repository" "frontend" {
  name = "${var.project_name}-frontend"

  # This will prevent Terraform from failing if the repository already exists
  lifecycle {
    ignore_changes = [name]
    prevent_destroy = true
  }
}

# 3. RDS Database and Secrets Manager
resource "aws_db_subnet_group" "default" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = [aws_subnet.public_1.id, aws_subnet.public_2.id]
  
  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }

  # This will prevent Terraform from failing if the subnet group already exists
  lifecycle {
    ignore_changes = [name, subnet_ids]
    prevent_destroy = true
  }
}

resource "aws_db_parameter_group" "postgres_params" {
  name   = "${var.project_name}-postgres-params"
  family = "${var.db_version}"  # Use the appropriate version for your DB

  parameter {
    name  = "rds.force_ssl"
    value = "0"  # Disable force SSL
  }
}

resource "aws_db_instance" "default" {
  allocated_storage      = var.db_storage
  engine                 = var.db_engine
  instance_class         = var.db_instance
  db_name                = var.db_name
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.default.name
  vpc_security_group_ids = var.db_publicly_accessible ? [aws_security_group.rds_sg.id, aws_security_group.rds_public_sg[0].id] : [aws_security_group.rds_sg.id]
  skip_final_snapshot    = var.db_skip_final_snapshot
  publicly_accessible    = var.db_publicly_accessible
  parameter_group_name   = aws_db_parameter_group.postgres_params.name
  
  # Ensure the DB accepts connections with SSL but doesn't require it
  iam_database_authentication_enabled = false
  
  lifecycle {
    ignore_changes = [password, db_subnet_group_name]
    prevent_destroy = true
  }
}

resource "aws_secretsmanager_secret" "db_creds" {
  name = "${var.project_name}/${var.secret_name}"

  lifecycle {
    ignore_changes = [name]
    prevent_destroy = true
  }
}

resource "aws_secretsmanager_secret_version" "db_creds_version" {
  secret_id     = aws_secretsmanager_secret.db_creds.id
  secret_string = jsonencode({
    host     = aws_db_instance.default.address
    username = aws_db_instance.default.username
    password = aws_db_instance.default.password
    dbname   = aws_db_instance.default.db_name
    port     = "5432"
  })
}

resource "aws_secretsmanager_secret" "jwt_secrets" {
  name = "${var.project_name}/${var.jwt_secret_name}"

  lifecycle {
    ignore_changes = [name]
    prevent_destroy = true
  }
}

resource "aws_secretsmanager_secret_version" "jwt_secrets_version" {
  secret_id     = aws_secretsmanager_secret.jwt_secrets.id
  secret_string = jsonencode({
    auth_jwt_secret     = var.auth_jwt_secret
    inv_jwt_secret      = var.inv_jwt_secret
    remember_token      = var.remember_token
    session_secret      = var.session_secret
    local_frontend_url  = var.local_frontend_url
    local_backend_url   = var.local_backend_url
  })
}

# IAM role for EC2 to access ECR
resource "aws_iam_role" "ec2_ecr_access_role" {
  name = "${var.project_name}-ec2-ecr-access-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      },
    ]
  })

  lifecycle {
    ignore_changes = [name, assume_role_policy]
    prevent_destroy = true
  }
}

resource "aws_iam_role_policy" "ecr_access_policy" {
  name = "${var.project_name}-ecr-access-policy"
  role = aws_iam_role.ec2_ecr_access_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.db_creds.arn,
          aws_secretsmanager_secret.jwt_secrets.arn
        ]
      }
    ]
  })
  
  lifecycle {
    ignore_changes = [policy, role]
  }
}

resource "aws_iam_instance_profile" "ec2_ecr_access_profile" {
  name = "${var.project_name}-ec2-ecr-access-profile"
  role = aws_iam_role.ec2_ecr_access_role.name
  
  lifecycle {
    ignore_changes = [name, role]
    prevent_destroy = true
  }
}

# Generate a new key pair for EC2 access
resource "tls_private_key" "instance_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "generated_key" {
  key_name   = "${var.project_name}-key"
  public_key = tls_private_key.instance_key.public_key_openssh

  lifecycle {
    ignore_changes = [key_name, public_key]
    prevent_destroy = true
  }
}

# Output the private key to a file (secure this appropriately)
resource "local_file" "private_key" {
  content  = tls_private_key.instance_key.private_key_pem
  filename = "${path.module}/${var.project_name}-key.pem"
  file_permission = "0600"
}

# Get an appropriate AMI for the EC2 instance
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# EC2 instance with Docker (first step - no self-reference)
resource "aws_instance" "app_instance" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public_1.id
  vpc_security_group_ids = [aws_security_group.app_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_ecr_access_profile.name
  key_name               = aws_key_pair.generated_key.key_name
  
  user_data = <<-EOF
    #!/bin/bash
    
    # Update packages
    yum update -y
    
    # Install Docker
    amazon-linux-extras install docker -y
    systemctl enable docker
    systemctl start docker
    usermod -a -G docker ec2-user
    
    # Install AWS CLI
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    ./aws/install
    
    # Install Docker Compose
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    # Create app directory
    mkdir -p /home/ec2-user/app
    
    # Create docker-compose.yml file (with placeholder)
    cat > /home/ec2-user/app/docker-compose.yml << 'COMPOSE'
    version: '3.8'
    services:
      backend:
        image: ${aws_ecr_repository.backend.repository_url}:latest
        restart: always
        ports: 
          - '3000:3000'
        environment:
          DB_HOST: ${aws_db_instance.default.address}
          DB_USER: ${aws_db_instance.default.username}
          DB_PASSWORD: ${var.db_password}
          DB_NAME: ${aws_db_instance.default.db_name}
          PORT: 3000
          NODE_ENV: production
          AUTH_JWT_SECRET: ${var.auth_jwt_secret}
          INV_JWT_SECRET: ${var.inv_jwt_secret}
          REMEMBER_TOKEN: ${var.remember_token}
          SESSION_SECRET: ${var.session_secret}
          LOCAL_FRONTEND_URL: http://localhost
          LOCAL_BACKEND_URL: http://localhost:3000
          AWS_FRONTEND_URL: http://INSTANCE_DNS_PLACEHOLDER
      frontend:
        image: ${aws_ecr_repository.frontend.repository_url}:latest
        depends_on:
          - backend
        environment:
          VITE_API_URL: http://INSTANCE_DNS_PLACEHOLDER:3000
        ports:
          - '80:80'
          - '443:443'
    COMPOSE

    # Create update script
    cat > /home/ec2-user/app/update.sh << 'SCRIPT'
    #!/bin/bash
    cd /home/ec2-user/app
    
    aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${aws_ecr_repository.backend.repository_url}
    docker pull ${aws_ecr_repository.backend.repository_url}:latest
    docker pull ${aws_ecr_repository.frontend.repository_url}:latest

    docker-compose down
    docker-compose up -d --build
    SCRIPT
    
    # Make script executable
    chmod +x /home/ec2-user/app/update.sh
    
    # Set permissions
    chown -R ec2-user:ec2-user /home/ec2-user/app
    
    # Create placeholder for DNS update script
    cat > /home/ec2-user/app/update_dns.sh << 'SCRIPT'
    #!/bin/bash
    PUBLIC_DNS=$(curl -s http://169.254.169.254/latest/meta-data/public-hostname)
    sed -i "s|INSTANCE_DNS_PLACEHOLDER|$PUBLIC_DNS|g" /home/ec2-user/app/docker-compose.yml
    SCRIPT
    
    # Make DNS update script executable
    chmod +x /home/ec2-user/app/update_dns.sh
    
    # Create crontab entry to check for updates every 10 minutes
    echo "*/10 * * * * ec2-user /home/ec2-user/app/update.sh >> /home/ec2-user/app/update.log 2>&1" > /etc/cron.d/app-updates
    chmod 0644 /etc/cron.d/app-updates
    
    # Update DNS and run initial deployment
    runuser -l ec2-user -c '/home/ec2-user/app/update_dns.sh && /home/ec2-user/app/update.sh'
  EOF

  root_block_device {
    volume_size = 30
    volume_type = "gp2"
  }

  tags = {
    Name = "${var.project_name}-app-instance"
  }

  # Wait for the instance to be created before outputting the DNS name
  depends_on = [aws_internet_gateway.gw]
}

# Check if CodeCommit is available in this account
data "aws_partition" "current" {}

# CodeCommit Repository with ignore_errors set
resource "aws_codecommit_repository" "app_repo" {
  repository_name = "${var.project_name}-repository"
  description     = "Cleo SPA Application Repository"
  
  tags = {
    Name = "${var.project_name}-repo"
  }

  lifecycle {
    ignore_changes = [repository_name, description]
    # This allows Terraform to continue even if there's an error creating the repository
    create_before_destroy = true
    prevent_destroy = true
  }
}

# S3 Bucket for CodePipeline artifacts
resource "aws_s3_bucket" "codepipeline_artifacts" {
  bucket = "${var.project_name}-codepipeline-artifacts-${random_string.bucket_suffix.result}"
}

resource "aws_s3_bucket_versioning" "codepipeline_artifacts_versioning" {
  bucket = aws_s3_bucket.codepipeline_artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "codepipeline_artifacts_encryption" {
  bucket = aws_s3_bucket.codepipeline_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# CodeBuild IAM Role
resource "aws_iam_role" "codebuild_role" {
  name = "${var.project_name}-codebuild-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codebuild.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "codebuild_policy" {
  role = aws_iam_role.codebuild_role.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject"
        ]
        Resource = [
          "${aws_s3_bucket.codepipeline_artifacts.arn}",
          "${aws_s3_bucket.codepipeline_artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetAuthorizationToken",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:SendCommand",
          "ssm:GetCommandInvocation"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances"
        ]
        Resource = "*"
      }
    ]
  })
}

# CodeBuild Project
resource "aws_codebuild_project" "app_build" {
  name          = "${var.project_name}-build"
  description   = "Build project for ${var.project_name}"
  service_role  = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                      = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
    type                       = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
    privileged_mode            = true

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = var.aws_region
    }

    environment_variable {
      name  = "AWS_ACCOUNT_ID"
      value = var.aws_account_id
    }

    environment_variable {
      name  = "BACKEND_IMAGE_URI"
      value = aws_ecr_repository.backend.repository_url
    }

    environment_variable {
      name  = "FRONTEND_IMAGE_URI"
      value = aws_ecr_repository.frontend.repository_url
    }

    environment_variable {
      name  = "EC2_INSTANCE_ID"
      value = aws_instance.app_instance.id
    }
  }

  source {
    type = "CODEPIPELINE"
    buildspec = "buildspec.yml"
  }
}

# CodePipeline IAM Role
resource "aws_iam_role" "codepipeline_role" {
  name = "${var.project_name}-codepipeline-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codepipeline.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "codepipeline_policy" {
  role = aws_iam_role.codepipeline_role.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketVersioning",
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject"
        ]
        Resource = [
          "${aws_s3_bucket.codepipeline_artifacts.arn}",
          "${aws_s3_bucket.codepipeline_artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "codecommit:CancelUploadArchive",
          "codecommit:GetBranch",
          "codecommit:GetCommit",
          "codecommit:GetRepository",
          "codecommit:ListBranches",
          "codecommit:ListRepositories"
        ]
        Resource = aws_codecommit_repository.app_repo.arn
      },
      {
        Effect = "Allow"
        Action = [
          "codebuild:BatchGetBuilds",
          "codebuild:StartBuild"
        ]
        Resource = aws_codebuild_project.app_build.arn
      }
    ]
  })
}

# CodePipeline
resource "aws_codepipeline" "app_pipeline" {
  name     = "${var.project_name}-pipeline"
  role_arn = aws_iam_role.codepipeline_role.arn

  artifact_store {
    location = aws_s3_bucket.codepipeline_artifacts.bucket
    type     = "S3"
  }

  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeCommit"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        RepositoryName = aws_codecommit_repository.app_repo.repository_name
        BranchName     = "master"
      }
    }
  }

  stage {
    name = "Build"

    action {
      name             = "Build"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["source_output"]
      version          = "1"

      configuration = {
        ProjectName = aws_codebuild_project.app_build.name
      }
    }
  }
}