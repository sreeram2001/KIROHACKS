"""TrueCost Engine CDK Stack.

Defines all AWS infrastructure: API Gateway, Lambda functions, DynamoDB tables,
and IAM roles with least-privilege policies.

AWS Profile: uoc
"""

import os

from aws_cdk import (
    Duration,
    RemovalPolicy,
    Stack,
)
from aws_cdk import aws_apigateway as apigw
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_iam as iam
from aws_cdk import aws_lambda as _lambda
from constructs import Construct


class TrueCostStack(Stack):
    """Main stack for the TrueCost Engine backend."""

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # ---------------------------------------------------------------
        # DynamoDB Tables
        # ---------------------------------------------------------------
        profiles_table = dynamodb.Table(
            self,
            "ProfilesTable",
            table_name="truecost-profiles",
            partition_key=dynamodb.Attribute(
                name="userId", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
        )

        decisions_table = dynamodb.Table(
            self,
            "DecisionsTable",
            table_name="truecost-decisions",
            partition_key=dynamodb.Attribute(
                name="userId", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # ---------------------------------------------------------------
        # Lambda code asset — shared across all Lambdas
        # ---------------------------------------------------------------
        backend_code = _lambda.Code.from_asset(
            os.path.join(os.path.dirname(__file__), "..", "..", "backend", "build", "lambda_package")
        )

        # ---------------------------------------------------------------
        # TrueCost Engine Lambda
        # ---------------------------------------------------------------
        truecost_lambda = _lambda.Function(
            self,
            "TrueCostEngineLambda",
            function_name="truecost-engine",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="truecost_handler.handler",
            code=backend_code,
            environment={
                "PROFILES_TABLE": profiles_table.table_name,
                "DECISIONS_TABLE": decisions_table.table_name,
                "BEDROCK_MODEL_ID": "us.anthropic.claude-3-5-haiku-20241022-v1:0",
                "BEDROCK_REGION": "us-east-1",
            },
            timeout=Duration.seconds(60),
            memory_size=512,
        )

        # DynamoDB read/write permissions for TrueCost Engine
        profiles_table.grant_read_write_data(truecost_lambda)
        decisions_table.grant_read_write_data(truecost_lambda)

        # Bedrock invoke permissions for LLM-powered cost analysis
        truecost_lambda.add_to_role_policy(
            iam.PolicyStatement(
                actions=[
                    "bedrock:InvokeModel",
                    "bedrock:InvokeModelWithResponseStream",
                    "bedrock:Converse",
                    "bedrock:ConverseStream",
                ],
                resources=["*"],
            )
        )

        # ---------------------------------------------------------------
        # Strands Agent Lambda (Chatbot)
        # ---------------------------------------------------------------
        chatbot_lambda = _lambda.Function(
            self,
            "StrandsAgentLambda",
            function_name="truecost-chatbot",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="chatbot_handler.handler",
            code=backend_code,
            environment={
                "BEDROCK_MODEL_ID": "us.anthropic.claude-3-5-haiku-20241022-v1:0",
                "BEDROCK_REGION": "us-east-1",
            },
            timeout=Duration.seconds(60),
            memory_size=1024,
        )

        # Bedrock invoke permissions (least-privilege)
        chatbot_lambda.add_to_role_policy(
            iam.PolicyStatement(
                actions=[
                    "bedrock:InvokeModel",
                    "bedrock:InvokeModelWithResponseStream",
                ],
                resources=["*"],
            )
        )

        # DynamoDB read permissions on profiles table for chatbot
        profiles_table.grant_read_data(chatbot_lambda)

        # ---------------------------------------------------------------
        # Profile Handler Lambda
        # ---------------------------------------------------------------
        profile_lambda = _lambda.Function(
            self,
            "ProfileHandlerLambda",
            function_name="truecost-profile-handler",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="profile_handler.handler",
            code=backend_code,
            environment={
                "PROFILES_TABLE": profiles_table.table_name,
                "DECISIONS_TABLE": decisions_table.table_name,
            },
            timeout=Duration.seconds(30),
            memory_size=512,
        )

        # DynamoDB read/write permissions for Profile Handler
        profiles_table.grant_read_write_data(profile_lambda)
        decisions_table.grant_read_write_data(profile_lambda)

        # ---------------------------------------------------------------
        # API Gateway REST API
        # ---------------------------------------------------------------
        api = apigw.RestApi(
            self,
            "TrueCostApi",
            rest_api_name="TrueCost API",
            description="TrueCost Engine REST API",
            deploy_options=apigw.StageOptions(stage_name="prod"),
            default_cors_preflight_options=apigw.CorsOptions(
                allow_origins=apigw.Cors.ALL_ORIGINS,
                allow_methods=apigw.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "Authorization"],
            ),
        )

        # POST /tec → TrueCost Engine Lambda
        tec_resource = api.root.add_resource("tec")
        tec_resource.add_method(
            "POST",
            apigw.LambdaIntegration(truecost_lambda),
        )

        # POST /chat → Strands Agent Lambda
        chat_resource = api.root.add_resource("chat")
        chat_resource.add_method(
            "POST",
            apigw.LambdaIntegration(chatbot_lambda),
        )

        # /profile/{userId} → Profile Handler Lambda
        profile_resource = api.root.add_resource("profile")
        profile_user_resource = profile_resource.add_resource("{userId}")
        profile_integration = apigw.LambdaIntegration(profile_lambda)
        profile_user_resource.add_method("GET", profile_integration)
        profile_user_resource.add_method("PUT", profile_integration)

        # /decisions/{userId} → Profile Handler Lambda (decision history)
        decisions_resource = api.root.add_resource("decisions")
        decisions_user_resource = decisions_resource.add_resource("{userId}")
        decisions_integration = apigw.LambdaIntegration(profile_lambda)
        decisions_user_resource.add_method("GET", decisions_integration)
        decisions_user_resource.add_method("POST", decisions_integration)
