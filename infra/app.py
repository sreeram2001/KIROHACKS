#!/usr/bin/env python3
"""CDK app entry point for TrueCost Engine infrastructure.

AWS Profile: uoc
"""
import aws_cdk as cdk

from stacks.truecost_stack import TrueCostStack

app = cdk.App()

TrueCostStack(
    app,
    "TrueCostStack",
    env=cdk.Environment(account="462993243919", region="us-east-1"),
)

app.synth()
