# AWS CodeCommit Deployment for CLEO SPA

This feature allows you to easily deploy your CLEO SPA code to AWS CodeCommit with one click.

## Prerequisites

1. AWS credentials must be configured in the AWS Configuration tab
2. Git must be installed on your system
3. AWS CLI must be installed and configured with the same credentials

## Using AWS CodeCommit Deployment

### Using the GUI

1. Open the CLEO SPA Setup tool
2. Go to the "AWS Deployment" tab
3. Click the "Deploy to CodeCommit" button
4. Select the project directory to deploy (typically the root of your project)
5. The tool will:
   - Create a new AWS CodeCommit repository
   - Initialize a Git repository in the selected directory
   - Add all files and commit them
   - Push the code to the AWS CodeCommit repository
6. After completion, the clone URL will be displayed in the console

### Using the Command Line

You can also deploy to AWS CodeCommit using the command line:

```bash
python main.py --deploy-codecommit /path/to/your/project
```

## Benefits of AWS CodeCommit

- **Fully managed** - AWS takes care of repository hosting and scaling
- **Integration with AWS services** - Works seamlessly with AWS CodePipeline, CodeBuild, and CodeDeploy
- **Security** - Uses IAM roles and policies for access control
- **High availability** - Built on AWS's reliable infrastructure
- **Private repositories** - Secure and accessible only to authorized users

## Next Steps

After deploying to AWS CodeCommit, you can:

1. Set up AWS CodePipeline for continuous integration and deployment
2. Configure AWS CodeBuild to build your application
3. Use AWS CodeDeploy to deploy your application to EC2, Lambda, or ECS
4. Set up notifications for repository events

## Troubleshooting

If you encounter issues:

1. Ensure your AWS credentials are correctly configured
2. Check that Git is properly installed and accessible from the command line
3. Make sure AWS CLI is installed and configured
4. Verify that you have sufficient permissions in your AWS account
