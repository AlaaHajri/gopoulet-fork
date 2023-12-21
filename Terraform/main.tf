# USEFUL COMANDS TO CHECK IF JENKINS IS RUNNING AND ITS STATUS :
# systemctl status jenkins
# sudo -i 
# nano /var/lib/jenkins/secrets/initialAdminPassword
# default admin
# https://medium.com/@navidehbaghaifar/how-to-install-jenkins-on-an-ec2-with-terraform-d5e9ed3cdcd9

provider "aws" {
  region = "us-east-1"
}

# Create a VPC
resource "aws_vpc" "app_vpc" {
  cidr_block = var.vpc_cidr

  tags = {
    Name = "app-vpc"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.app_vpc.id

  tags = {
    Name = "vpc_igw"
  }
}

resource "aws_subnet" "public_subnet" {
  vpc_id            = aws_vpc.app_vpc.id
  cidr_block        = var.public_subnet_cidr
  map_public_ip_on_launch = true
  availability_zone = "us-east-1a"

  tags = {
    Name = "public-subnet"
  }
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.app_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "public_rt"
  }
}

resource "aws_route_table_association" "public_rt_asso" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_rt.id
}


resource "aws_instance" "web" {
    ami             = "ami-0230bd60aa48260c6" 
    instance_type   = var.instance_type
    subnet_id       = aws_subnet.public_subnet.id
    security_groups = [aws_security_group.sg.id]

    key_name        = "vockey"

    user_data = <<-EOF
        #!/bin/bash
        #========================================== INSTALLING JENKINS =====================================================
        #Bootstrap Jenkins installation and start  
        #!/bin/bash #specifies the interpreter
        sudo yum update -y  # updates the package list and upgrades installed packages on the system
        sudo wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo  #downloads the Jenkins repository configuration file and saves it to /etc/yum.repos.d/jenkins.repo
        sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key  #imports the GPG key for the Jenkins repository. This key is used to verify the authenticity of the Jenkins packages
        sudo yum upgrade -y #  upgrades packages again, which might be necessary to ensure that any new dependencies required by Jenkins are installed
        sudo dnf install java-11-amazon-corretto -y  # installs Amazon Corretto 11, which is a required dependency for Jenkins.
        sudo yum install jenkins -y  #installs Jenkins itself
        sudo systemctl enable jenkins  #enables the Jenkins service to start automatically at boot time
        sudo systemctl start jenkins   #starts the Jenkins service immediately

        #========================================== INSTALLING npm  =====================================================
        #SRC: https://medium.com/@sushantkapare1717/deploying-nodejs-app-on-aws-ec2-instance-942e360e8430

        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
        . ~/.nvm/nvm.sh
        nvm install node
        #===== GITLAB REPO 
        git clone -b frontend https://oauth2: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@github.com/AlaaHajri/gopoulet-fork
        
        EOF

    tags = {
        Name = "GoPouletJenkins"
    }
    volume_tags = {
        Name = "GoPouletJenkins_volume"
    } 
}

output "web_instance_ip" {
    value = aws_instance.web.public_ip
}


#==============
# S3 BUCKET CONFIG 
resource "aws_s3_bucket" "ynovgopouletsite" {
  bucket = "ynovgopouletsite"
  object_lock_enabled = false
}

resource "aws_s3_bucket_ownership_controls" "example" {
  bucket = aws_s3_bucket.ynovgopouletsite.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_versioning" "ynovgopouletsite" {
  bucket = aws_s3_bucket.ynovgopouletsite.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_website_configuration" "ynovgopouletsite" {
  bucket = aws_s3_bucket.ynovgopouletsite.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_policy" "ynovgopouletsite_bucket_policy" {
  bucket = aws_s3_bucket.ynovgopouletsite.id

  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Id": "MYBUCKETPOLICY",
  "Statement": [
    {
      "Sid": "IPAllow",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": "${aws_s3_bucket.ynovgopouletsite.arn}/*",
      "Condition": {
         "IpAddress": {"aws:SourceIp": "8.8.8.8/32"}
      }
    }
  ]
}
POLICY
}




