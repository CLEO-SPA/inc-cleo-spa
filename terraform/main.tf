terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# 1. Networking (VPC and Security Groups)
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags = {
    Name = "${var.project_name}-vpc"
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  tags = {
    Name = "${var.project_name}-public-subnet"
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

resource "aws_route_table_association" "a" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_security_group" "ecs_sg" {
  name        = "${var.project_name}-ecs-sg"
  description = "Allow HTTP inbound traffic"
  vpc_id      = aws_vpc.main.id

  ingress {
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
}

resource "aws_security_group" "rds_sg" {
  name        = "${var.project_name}-rds-sg"
  description = "Allow traffic from ECS instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432 # PostgreSQL port
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_sg.id]
  }
}

# 2. ECR Repositories
resource "aws_ecr_repository" "backend" {
  name = "${var.project_name}-backend"
}

resource "aws_ecr_repository" "frontend" {
  name = "${var.project_name}-frontend"
}

# 3. RDS Database and Secrets Manager
resource "aws_db_subnet_group" "default" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = [aws_subnet.public.id]
}

resource "aws_db_instance" "default" {
  allocated_storage      = 10
  engine                 = "postgres"
  instance_class         = "db.t3.micro"
  db_name                = "cleospa"
  username               = "cleo_owner"
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.default.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot    = true
}

resource "aws_secretsmanager_secret" "db_creds" {
  name = "${var.project_name}/db-credentials"
}

resource "aws_secretsmanager_secret_version" "db_creds_version" {
  secret_id     = aws_secretsmanager_secret.db_creds.id
  secret_string = jsonencode({
    host     = aws_db_instance.default.address
    username = aws_db_instance.default.username
    password = aws_db_instance.default.password
    dbname   = aws_db_instance.default.db_name
  })
}

# 4. ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"
}

# 5. IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.project_name}-ecs-task-execution-role"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_policy" "secrets_manager_policy" {
  name        = "${var.project_name}-secrets-manager-policy"
  description = "Allows ECS tasks to access the DB credentials secret"
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Action   = "secretsmanager:GetSecretValue"
        Effect   = "Allow"
        Resource = [aws_secretsmanager_secret.db_creds.arn]
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "secrets_manager_attachment" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = aws_iam_policy.secrets_manager_policy.arn
}

# 6. ECS Task Definition and Service
data "template_file" "task_definition" {
  template = file("../task-definition.json")

  vars = {
    backend_image_uri  = var.backend_image_uri
    frontend_image_uri = var.frontend_image_uri
    secret_arn_prefix  = aws_secretsmanager_secret.db_creds.arn
  }
}

resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project_name}-task"
  network_mode             = "bridge"
  requires_compatibilities = ["EC2"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  container_definitions    = data.template_file.task_definition.rendered
}

resource "aws_ecs_service" "main" {
  name            = "${var.project_name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1
  launch_type     = "EC2"

  # This ensures the service doesn't try to start before the cluster is ready
  depends_on = [aws_internet_gateway.gw]
}
