#!/usr/bin/env python3
"""
Setup script for CLEO SPA setup tool.
"""
from setuptools import setup, find_packages

setup(
    name="cleo-setup",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "tk",  # For GUI
        "python-dotenv>=1.0.0",  # For environment variables
        "requests>=2.25.0",  # For API requests
        "PyJWT>=2.0.0",  # For JWT token handling
        "boto3>=1.28.0",  # For AWS integration (CodeCommit)
    ],
    entry_points={
        "console_scripts": [
            "cleo-setup=main:main",
        ],
    },
    author="CLEO SPA Team",
    author_email="info@cleospa.com",
    description="Setup tool for CLEO SPA application",
    keywords="spa, setup, aws, terraform, docker",
    python_requires=">=3.6",
)
