data "aws_ecs_cluster" "sjcadmin" {
    cluster_name = "CS-ECS-01"
}

resource "aws_ecr_repository" "app" {
    name = "sjcadmin/app"
}

resource "aws_ecr_repository" "nginx" {
    name = "sjcadmin/nginx"
}

data "template_file" "container_definitions" {
    template = "${file("${path.module}/data/container_definitions.json")}"
}

resource "aws_ecs_task_definition" "sjcadmin" {
    family                   = "sjcadmin"
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

data "aws_iam_policy_document" "sjcadmin-deploy" {
    statement {
        effect = "Allow"
        actions = ["ecr:GetAuthorizationToken"]
        resources = ["*"]
    }

    statement {
        effect = "Allow"
        actions = ["ecs:UpdateService"]
        resources = ["arn:aws:ecs:eu-west-2:082624796438:service/CS-ECS-*/sjcadmin*"]
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
            "arn:aws:ecr:*:082624796438:repository/sjcadmin*",
        ]
    }
}

resource "aws_iam_policy" "sjcadmin-deploy" {
    name   = "sjcadmin-deploy"
    policy = data.aws_iam_policy_document.sjcadmin-deploy.json
}

resource "aws_iam_user_policy_attachment" "sjcadmin-deploy" {
    user = aws_iam_user.sjcadmin-deploy.name
    policy_arn = aws_iam_policy.sjcadmin-deploy.arn
}

resource "aws_ecs_service" "sjcadmin" {
    name                = "sjcadmin"
    cluster             = data.aws_ecs_cluster.sjcadmin.arn
    task_definition     = aws_ecs_task_definition.sjcadmin.arn
    scheduling_strategy = "DAEMON"
}