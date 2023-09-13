terraform {
    required_providers {
        aws = {
            source  = "hashicorp/aws"
            version = "~> 5.12"
        }
    }

    backend "s3" {
        bucket = "terraform-eu-west-2-082624796438"
        key    = "sjcadmin"
        region = "eu-west-2"
    }
}

provider "aws" {
    region = "eu-west-2"
}
