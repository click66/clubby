data "aws_ecs_cluster" "sjcadmin" {
    cluster_name = "CS-ECS-02"
}

resource "aws_ecr_repository" "app" {
    name = "sjcadmin-attendance/app"
}

data "template_file" "container_definitions" {
    template = "${file("${path.module}/data/container_definitions.json")}"
}

resource "aws_ecs_task_definition" "sjcadmin-attendance" {
    family                   = "sjcadmin-attendance"
    container_definitions    = data.template_file.container_definitions.rendered
    task_role_arn            = "arn:aws:iam::082624796438:role/ecsTaskExecutionRole"
    execution_role_arn       = "arn:aws:iam::082624796438:role/ecsTaskExecutionRole"
    network_mode             = "bridge"
    requires_compatibilities = ["EC2"]
    cpu                      = "256"
    memory                   = "256"

    runtime_platform {
        cpu_architecture = "X86_64"
        operating_system_family = "LINUX"
    }
}

resource "aws_ecs_service" "sjcadmin-attendance" {
    name                = "sjcadmin-attendance"
    cluster             = data.aws_ecs_cluster.sjcadmin.arn
    task_definition     = aws_ecs_task_definition.sjcadmin-attendance.arn
    scheduling_strategy = "DAEMON"
}