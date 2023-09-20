data "aws_vpc" "services-01" {
    tags = {
        Name = "vpc-clarkservices-01"
    }
}

data "aws_ecs_cluster" "clarksirl" {
    cluster_name = "CS-ECS-02"
}

resource "aws_s3_bucket" "sjcadmin_frontend" {
    bucket = "sjcadmin-frontend"

    cors_rule {
        allowed_headers = ["Authorization", "Content-Length"]
        allowed_methods = ["GET", "POST"]
        allowed_origins = ["https://admin.southcoastjiujitsu.com"]
        max_age_seconds = 3000
    }
}

resource "aws_s3_bucket_website_configuration" "sjcadmin_frontend" {
    bucket = aws_s3_bucket.sjcadmin_frontend.id

    index_document {
        suffix = "index.html"
    }

    error_document {
        key = "index.html"
    }
}

resource "aws_s3_bucket_public_access_block" "sjcadmin_frontend" {
    bucket = aws_s3_bucket.sjcadmin_frontend.id

    block_public_acls   = false
    block_public_policy = false
}

data "aws_iam_policy_document" "sjcadmin_frontend" {
    statement {
        principals {
            type        = "AWS"
            identifiers = ["*"]
        }

        actions = ["s3:GetObject"]

        resources = ["${aws_s3_bucket.sjcadmin_frontend.arn}/*"]

        condition {
            test = "StringEquals"
            variable = "aws:SourceVpc"

            values = [data.aws_vpc.services-01.id]
        }
    }

    statement {
        principals {
            type        = "AWS"
            identifiers = [aws_iam_user.sjcadmin-deploy.arn]
        }

        actions = ["s3:*"]

        resources = [
            aws_s3_bucket.sjcadmin_frontend.arn,
            "${aws_s3_bucket.sjcadmin_frontend.arn}/*",
        ]
    }
}

resource "aws_s3_bucket_policy" "sjcadmin_frontend" {
    bucket = aws_s3_bucket.sjcadmin_frontend.id
    policy = data.aws_iam_policy_document.sjcadmin_frontend.json
}