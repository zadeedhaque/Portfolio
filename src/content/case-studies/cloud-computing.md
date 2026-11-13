---
title: "Cloud Computing Architecture"
---


- **3** Assignments on one Photo Album app
- **2 Availability Zones** Web tier built to survive a data-centre failure

## The *projects*

*Assignments 1a & 1b*

### Photo Album Web App on AWS

A PHP photo album website deployed on AWS, with photos stored in S3 and photo details stored in a MySQL database.

#### What I did

- Deployed a PHP/Apache web server on an Amazon EC2 instance (Linux) inside my own VPC.
- Stored uploaded photos in an Amazon S3 bucket.
- Stored photo metadata (title, description, date, keywords) in an Amazon RDS MySQL database.
- Built a photo lookup page that searches the database and shows the matching photos from S3.
- Configured security groups to control access to the web server and database, and managed the database with phpMyAdmin.

#### Tech

AWS EC2 · VPC · S3 · RDS (MySQL) · PHP · Apache · Linux · phpMyAdmin

*Assignment 2*

### Highly Available Photo Album Website

I rebuilt the Photo Album app so it keeps running even if a server or a whole AWS data centre fails, and so it scales automatically with traffic.

#### What I did

- Designed a custom VPC across two Availability Zones, each with a public and a private subnet, plus an Internet Gateway and a NAT instance so the private servers could reach outside services.
- Put the web servers in private subnets with no public IP. An Application Load Balancer is the only way in, and it runs health checks on each server.
- Built a custom AMI and launch template, then created an Auto Scaling Group (2–3 instances) with a target-tracking policy based on requests per server.
- Wrote a Lambda function in Python that automatically creates a thumbnail for every uploaded photo.
- Secured the system in layers: five purpose-specific security groups, a Network ACL on the private subnets, an S3 bucket policy so photos can only be loaded through the website, and IAM roles that let EC2, Lambda and S3 work together.
- Tested the whole flow end to end: uploading, storing, generating thumbnails and serving through the load balancer.

#### Challenges I solved

- Fixed the S3 bucket policy after finding that browsers send the load balancer hostname in lowercase, which the policy hadn’t matched.
- Worked around AWS Learner Lab restrictions, such as being unable to create custom IAM roles or run ASG instance refresh.
- Cut cloud costs by replacing the NAT Gateway with a small NAT instance and by cleaning up unused Elastic IPs and leftover resources.

#### Tech

VPC · EC2 · Auto Scaling · Application Load Balancer · NAT · Lambda (Python) · S3 · RDS MySQL · IAM · Security Groups · NACLs · CloudWatch

*Assignment 3 · team project*

### Serverless, Event-Driven Architecture Redesign

With a partner, I redesigned the Photo Album app as a fully serverless, event-driven system for a company whose demand doubles every six months. It processes photos (and later videos) automatically and serves users worldwide quickly.

#### The problem

The existing app was struggling:

- Six EC2 instances running above 80% CPU
- A slow, expensive relational database
- Poor response times for overseas users
- No automated media processing

#### What we designed

- A minimal 8-service architecture: CloudFront for global delivery; API Gateway, Lambda, DynamoDB and S3 for the application; EventBridge, SQS and MediaConvert for background media processing.
- Uploads go straight to S3 through pre-signed URLs, so large files never pass through the backend.
- S3 upload events go through EventBridge into SQS queues, with separate pipelines for images and videos. The user never waits for processing, and new steps (such as AI tagging) can be added later without changing the app.
- Justified every service, explaining why we chose it and why alternatives such as EC2, VPC, SNS, Cognito, Fargate and RDS were left out, and evaluated the design against the AWS Well-Architected pillars.
- Produced an architecture diagram and UML collaboration diagrams, plus an AWS Pricing Calculator cost estimate. Trimming the service footprint cut the estimated monthly cost from about $712 to about $389.
- Delivered an IEEE-style technical report and a group presentation.

#### Tech

CloudFront · API Gateway · Lambda · DynamoDB · S3 · EventBridge · SQS · MediaConvert · IAM · CloudWatch · draw.io · AWS Pricing Calculator

## What the course *covered*

*Weeks 1–2*

### Cloud foundations & compute

- What cloud computing is: virtualisation, the major cloud providers, and the IaaS / PaaS / SaaS service models.
- How AWS is organised globally: Regions, Availability Zones and edge locations.
- EC2 virtual machines: AMIs, instance types, key pairs, connecting over SSH from Windows or Mac, and auto-configuring instances with user-data scripts. Basic Linux on EC2.
- A first look at serverless compute (Lambda) and containers.

*Week 3*

### Networking

- VPCs, public vs private subnets, route tables, Internet Gateways and NAT.
- Security groups (stateful, instance level) vs NACLs (stateless, subnet level).
- VPC peering, CloudFront/CDN caching, and how routing works.

*Week 4*

### Storage

- Block storage: EBS volumes and snapshots.
- File storage: EFS, which many instances can share.
- Object storage: S3 (buckets, policies, static website hosting) and Glacier for cheap archival.

*Week 5*

### Databases

- Relational (SQL) vs NoSQL databases and when to use each.
- Amazon RDS (managed MySQL with Multi-AZ and read replicas), DynamoDB (key-value NoSQL), and other options. Also phpMyAdmin on EC2.

*Week 6*

### Security

- IAM users, groups, roles and JSON policies, with least privilege as the guiding principle.
- Securing a new account: protecting the root user, MFA, and CloudTrail auditing.
- Encryption of data at rest and in transit.

*Weeks 7–8*

### High availability & scaling

- High availability vs fault tolerance, and the reason to deploy across multiple AZs.
- Elastic Load Balancing (the Application Load Balancer) with health checks.
- CloudWatch metrics and alarms.
- Auto Scaling groups: launch templates, min/max/desired capacity, and target-tracking, scheduled and predictive scaling policies.
- Scaling the data tier, event-driven scaling with Lambda, and Infrastructure as Code with CloudFormation templates.

*Week 9*

### Decoupled & serverless architectures

- Request–response vs message-driven and event-driven designs.
- SQS queues, SNS pub/sub, and Lambda triggered by events such as an S3 upload.
- Why decoupling improves resilience and lets each component scale independently.

*Week 10*

### DNS & design patterns

- Route 53 routing policies across regions, including failover, latency-based and weighted routing.
- Common HA patterns, plus disaster-recovery strategies ranging from backup & restore through pilot light and warm standby to multi-site active/active, traded off against RTO/RPO and cost.

*Week 11*

### Evaluating an architecture

- The AWS Well-Architected Framework: operational excellence, security, reliability, performance efficiency, cost optimisation and sustainability.
- Troubleshooting, and using review questions to critique a design.
