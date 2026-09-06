import re

with open('lib/api-spec/openapi.yaml', 'r') as f:
    content = f.read()

# Append properties to User
user_prop_idx = content.find("        onboardingComplete: {type: boolean}")
if user_prop_idx != -1:
    content = content[:user_prop_idx + 43] + "\n        canManageMembers: {type: boolean}\n        isPending: {type: boolean}" + content[user_prop_idx + 43:]

# Append InviteUserInput to schemas
components_idx = content.find("    User:")
if components_idx != -1:
    schema = """    InviteUserInput:
      type: object
      required: [email, role, preferredName]
      properties:
        email: {type: string}
        role: {type: string, enum: [amanah_partner, nurse, companion]}
        preferredName: {type: string}
"""
    content = content[:components_idx] + schema + content[components_idx:]

# Append endpoints
users_endpoint_idx = content.find("  /tasks:")
if users_endpoint_idx != -1:
    endpoints = """  /users/invite:
    post:
      operationId: inviteUser
      tags: [wasl]
      requestBody:
        required: true
        content:
          application/json:
            schema: {$ref: "#/components/schemas/InviteUserInput"}
      responses:
        "200":
          description: Invited user
          content:
            application/json:
              schema: {$ref: "#/components/schemas/User"}
  /onboarding/pending:
    get:
      operationId: getPendingOnboarding
      tags: [wasl]
      responses:
        "200":
          description: Pending user details
          content:
            application/json:
              schema:
                type: object
                properties:
                  role: {type: string}
                  preferredName: {type: string}
"""
    content = content[:users_endpoint_idx] + endpoints + content[users_endpoint_idx:]

with open('lib/api-spec/openapi.yaml', 'w') as f:
    f.write(content)

