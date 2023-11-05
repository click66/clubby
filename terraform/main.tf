data "aws_ecs_cluster" "cs1" {
    cluster_name = "CS-ECS-01"
}

resource "aws_ecr_repository" "app" {
    name = "clubby/app"
}

resource "aws_ecr_repository" "nginx" {
    name = "clubby/nginx"
}

data "template_file" "container_definitions" {
    template = "${file("${path.module}/data/container_definitions.json")}"
}

resource "aws_ecs_task_definition" "clubby" {
    family                   = "clubby"
    container_definitions    = data.template_file.container_definitions.rendered
    task_role_arn            = "arn:aws:iam::082624796438:role/ecsTaskExecutionRole"
    execution_role_arn       = "arn:aws:iam::082624796438:role/ecsTaskExecutionRole"
    network_mode             = "bridge"
    requires_compatibilities = ["EC2"]
    cpu                      = "512"
    memory                   = "512"

    runtime_platform {
        cpu_architecture = "X86_64"
        operating_system_family = "LINUX"
    }
}

resource "aws_iam_user" "sjcadmin-deploy" {
    name = "sjcadmin-deploy"
    path = "/"
}

data "aws_iam_policy_document" "clubby-deploy" {
    statement {
        effect = "Allow"
        actions = ["ecr:GetAuthorizationToken"]
        resources = ["*"]
    }

    statement {
        effect = "Allow"
        actions = ["ecs:UpdateService"]
        resources = ["arn:aws:ecs:eu-west-2:082624796438:service/CS-ECS-*/clubby*"]
    }

    statement {
        effect = "Allow"
        actions = [
            "ecr:GetDownloadUrlForLayer",
            "ecr:BatchGetImage",
            "ecr:CompleteLayerUpload",
            "ecr:UploadLayerPart",
            "ecr:InitiateLayerUpload",
            "ecr:BatchCheckLayerAvailability",
            "ecr:PutImage",
        ]
        resources = [
            "arn:aws:ecr:*:082624796438:repository/clubby*",
        ]
    }
}

resource "aws_iam_policy" "clubby-deploy" {
    name   = "clubby-deploy"
    policy = data.aws_iam_policy_document.clubby-deploy.json
}

resource "aws_iam_user_policy_attachment" "clubby-deploy" {
    user = aws_iam_user.sjcadmin-deploy.name
    policy_arn = aws_iam_policy.clubby-deploy.arn
}

resource "aws_ecs_service" "clubby" {
    name                = "clubby"
    cluster             = data.aws_ecs_cluster.cs1.arn
    task_definition     = aws_ecs_task_definition.clubby.arn
    scheduling_strategy = "DAEMON"
}

