# CLEO SPA Setup Tool

A comprehensive setup and deployment tool for CLEO SPA application. This tool provides a user-friendly interface for both local development and AWS deployment.

## Features

- **AWS Deployment**: Configure and deploy the CLEO SPA application to AWS using Terraform
- **Local Development**: Manage local development environment using Docker Compose
- **Secure Configuration**: Generate and manage secure credentials for database and JWT tokens

## Prerequisites

- Python 3.6 or higher
- Docker (for both local development and AWS deployment)
- AWS account (for deployment only)

## Installation

1. Clone the repository
2. Navigate to the setup directory:
   ```
   cd setup
   ```
3. Install the package:
   ```
   pip install -r requirements.txt
   pip install -e .
   ```

## Usage

### Starting the GUI

```
python main.py
```

### AWS Deployment

1. Open the "AWS Configuration" tab
2. Enter your AWS credentials and configuration settings
3. Generate secure secrets using the "Generate Random Secrets" button
4. Save the configuration
5. Go to the "AWS Deployment" tab
6. Initialize Terraform, then plan and apply the deployment

### Local Development

1. Open the "Local Development" tab
2. Configure database credentials and port mappings
3. Update the Docker Compose configuration
4. Start the local environment

## Structure

```
setup/
│
├── cleo_setup/
│   ├── __init__.py        # Package initialization
│   ├── app.py             # Main application class
│   ├── aws_deployment.py  # AWS deployment functionality
│   ├── local_development.py # Local development functionality
│   └── utils.py           # Utility functions
│
├── main.py                # Entry point script
├── setup.py               # Package setup script
├── requirements.txt       # Dependencies
└── README.md              # This file
```

## License

See the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
