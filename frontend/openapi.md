{
  "openapi": "3.1.0",
  "info": {
    "title": "FastAPI",
    "version": "0.1.0"
  },
  "paths": {
    "/auth/login": {
      "post": {
        "summary": "Login",
        "operationId": "login_auth_login_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/LoginRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/auth/refresh": {
      "post": {
        "summary": "Refresh Token",
        "operationId": "refresh_token_auth_refresh_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/TokenRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/auth/logout": {
      "post": {
        "summary": "Logout",
        "operationId": "logout_auth_logout_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/TokenRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/token": {
      "post": {
        "summary": "Create Token",
        "operationId": "create_token_token_post",
        "requestBody": {
          "content": {
            "application/x-www-form-urlencoded": {
              "schema": {
                "$ref": "#/components/schemas/Body_create_token_token_post"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/auth/validate": {
      "get": {
        "summary": "Validate Token",
        "operationId": "validate_token_auth_validate_get",
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          }
        },
        "security": [
          {
            "OAuth2PasswordBearer": []
          }
        ]
      }
    },
    "/secure-data": {
      "get": {
        "summary": "Secure Data",
        "operationId": "secure_data_secure_data_get",
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          }
        },
        "security": [
          {
            "OAuth2PasswordBearer": []
          }
        ]
      }
    },
    "/chatbot": {
      "post": {
        "summary": "Chatbot Realestate",
        "operationId": "chatbot_realestate_chatbot_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/QueryRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        },
        "security": [
          {
            "OAuth2PasswordBearer": []
          }
        ]
      }
    },
    "/api/sequence-groups": {
      "get": {
        "summary": "Get Sequence Groups Api",
        "description": "Get sequence groups with their items.\n\n- **group_id**: (Optional) Filter by specific group ID. Default -1 returns all groups.",
        "operationId": "get_sequence_groups_api_api_sequence_groups_get",
        "security": [
          {
            "OAuth2PasswordBearer": []
          }
        ],
        "parameters": [
          {
            "name": "group_id",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Group ID to filter by. Use -1 for all groups",
              "default": -1,
              "title": "Group Id"
            },
            "description": "Group ID to filter by. Use -1 for all groups"
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/only-sequence-groups": {
      "get": {
        "summary": "Get Sequence Groups Api",
        "description": "Get sequence groups Only\n\n- **group_id**: (Optional) Filter by specific group ID. Default -1 returns all groups.",
        "operationId": "get_sequence_groups_api_api_only_sequence_groups_get",
        "security": [
          {
            "OAuth2PasswordBearer": []
          }
        ],
        "parameters": [
          {
            "name": "group_id",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Group ID to filter by. Use -1 for all groups",
              "default": -1,
              "title": "Group Id"
            },
            "description": "Group ID to filter by. Use -1 for all groups"
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/sequence-items/position": {
      "patch": {
        "summary": "Update Sequence Item Position Api",
        "description": "Update the position of a sequence item and reorder other items accordingly.\n\n- **group_id**: ID of the sequence group\n- **old_position**: Current position of the item (1-based index)\n- **new_position**: New position for the item (1-based index)",
        "operationId": "update_sequence_item_position_api_api_sequence_items_position_patch",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateSequencePositionRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        },
        "security": [
          {
            "OAuth2PasswordBearer": []
          }
        ]
      }
    },
    "/api/create-Group-Item": {
      "post": {
        "summary": "Create Group And Items Api",
        "description": "Add new group and item",
        "operationId": "create_group_and_items_api_api_create_Group_Item_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/SequenceCreateGroupandItem"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        },
        "security": [
          {
            "OAuth2PasswordBearer": []
          }
        ]
      }
    },
    "/api/create-items": {
      "post": {
        "summary": "Create Items Api",
        "description": "Add items",
        "operationId": "create_items_api_api_create_items_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/SequenceItemforOldGroup"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        },
        "security": [
          {
            "OAuth2PasswordBearer": []
          }
        ]
      }
    },
    "/api/delete-sequence-group": {
      "delete": {
        "summary": "Delete Sequence Group Api",
        "description": "Delete sequence group",
        "operationId": "delete_sequence_group_api_api_delete_sequence_group_delete",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/deleteSequenceGroup"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        },
        "security": [
          {
            "OAuth2PasswordBearer": []
          }
        ]
      }
    },
    "/api/delete-sequence-item": {
      "delete": {
        "summary": "Delete Sequence Item Api",
        "description": "Delete sequence item",
        "operationId": "delete_sequence_item_api_api_delete_sequence_item_delete",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/deleteSequenceItem"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        },
        "security": [
          {
            "OAuth2PasswordBearer": []
          }
        ]
      }
    },
    "/api/update-sequence-group": {
      "patch": {
        "summary": "Update Sequence Group Api",
        "description": "Update sequence group",
        "operationId": "update_sequence_group_api_api_update_sequence_group_patch",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/updateSequenceGroup"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        },
        "security": [
          {
            "OAuth2PasswordBearer": []
          }
        ]
      }
    },
    "/api/update-sequence-item": {
      "patch": {
        "summary": "Update Sequence Item Api",
        "description": "Update sequence item",
        "operationId": "update_sequence_item_api_api_update_sequence_item_patch",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/updateSequenceItem"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        },
        "security": [
          {
            "OAuth2PasswordBearer": []
          }
        ]
      }
    },
    "/workflow_save": {
      "post": {
        "summary": "Save Workflow",
        "operationId": "save_workflow_workflow_save_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/SaveWorkflowRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/SaveWorkflowResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        },
        "security": [
          {
            "OAuth2PasswordBearer": []
          }
        ]
      }
    },
    "/workflow/list": {
      "get": {
        "summary": "List Workflows",
        "description": "List all saved nq_workflows with their metadata.",
        "operationId": "list_workflows_workflow_list_get",
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          }
        },
        "security": [
          {
            "OAuth2PasswordBearer": []
          }
        ]
      }
    },
    "/workflow/{workflow_id}": {
      "get": {
        "summary": "Get Workflow By Id",
        "description": "Get a specific workflow by ID.",
        "operationId": "get_workflow_by_id_workflow__workflow_id__get",
        "security": [
          {
            "OAuth2PasswordBearer": []
          }
        ],
        "parameters": [
          {
            "name": "workflow_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "Workflow Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "Delete Workflow By Id",
        "description": "Delete a workflow and all its nodes.",
        "operationId": "delete_workflow_by_id_workflow__workflow_id__delete",
        "security": [
          {
            "OAuth2PasswordBearer": []
          }
        ],
        "parameters": [
          {
            "name": "workflow_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "Workflow Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/workflows/active": {
      "get": {
        "summary": "Get Active Workflow",
        "operationId": "get_active_workflow_workflows_active_get",
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ActiveWorkflowResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "OAuth2PasswordBearer": []
          }
        ]
      }
    },
    "/workflow/active": {
      "post": {
        "summary": "Set Active Workflow",
        "operationId": "set_active_workflow_workflow_active_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/SetActiveWorkflowRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ActiveWorkflowResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        },
        "security": [
          {
            "OAuth2PasswordBearer": []
          }
        ]
      }
    },
    "/workflow/category-options/{category}": {
      "get": {
        "summary": "Get Category Options",
        "description": "Get options for a specific category from the database.\nUsed by workflow editor to suggest options for button-list and dropdown nodes.",
        "operationId": "get_category_options_workflow_category_options__category__get",
        "security": [
          {
            "OAuth2PasswordBearer": []
          }
        ],
        "parameters": [
          {
            "name": "category",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "Category"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/agents": {
      "get": {
        "summary": "Get All Agents Api",
        "description": "Get all agents",
        "operationId": "get_all_agents_api_api_agents_get",
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          }
        }
      },
      "put": {
        "summary": "Update Agent Api",
        "description": "Update an agent",
        "operationId": "update_agent_api_api_agents_put",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/AgentUpdateRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Create Agent Api",
        "description": "Create a new agent",
        "operationId": "create_agent_api_api_agents_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/AgentCreateRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/agents/{agent_id}": {
      "get": {
        "summary": "Get Agent Api",
        "description": "Get agent by ID",
        "operationId": "get_agent_api_api_agents__agent_id__get",
        "parameters": [
          {
            "name": "agent_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "title": "Agent Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "Delete Agent Api",
        "description": "Delete an agent",
        "operationId": "delete_agent_api_api_agents__agent_id__delete",
        "parameters": [
          {
            "name": "agent_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "title": "Agent Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/skills": {
      "get": {
        "summary": "Get All Skills Api",
        "description": "Get all skills",
        "operationId": "get_all_skills_api_api_skills_get",
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          }
        }
      },
      "put": {
        "summary": "Update Skill Api",
        "description": "Update a skill",
        "operationId": "update_skill_api_api_skills_put",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/SkillUpdateRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Create Skill Api",
        "description": "Create a new skill",
        "operationId": "create_skill_api_api_skills_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/SkillCreateRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/skills/{skill_id}": {
      "get": {
        "summary": "Get Skill Api",
        "description": "Get skill by ID",
        "operationId": "get_skill_api_api_skills__skill_id__get",
        "parameters": [
          {
            "name": "skill_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "title": "Skill Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "Delete Skill Api",
        "description": "Delete a skill",
        "operationId": "delete_skill_api_api_skills__skill_id__delete",
        "parameters": [
          {
            "name": "skill_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "title": "Skill Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/agent-skills": {
      "put": {
        "summary": "Update Agent Skill Api",
        "description": "Update an agent skill",
        "operationId": "update_agent_skill_api_api_agent_skills_put",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/AgentSkillUpdateRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Create Agent Skill Api",
        "description": "Create a new agent skill",
        "operationId": "create_agent_skill_api_api_agent_skills_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/AgentSkillCreateRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/agents/{agent_id}/skills": {
      "get": {
        "summary": "Get Agent Skills Api",
        "description": "Get skills for an agent",
        "operationId": "get_agent_skills_api_api_agents__agent_id__skills_get",
        "parameters": [
          {
            "name": "agent_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "title": "Agent Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/agent-skills/{agent_id}/{skill_id}": {
      "delete": {
        "summary": "Delete Agent Skill Api",
        "description": "Delete an agent skill",
        "operationId": "delete_agent_skill_api_api_agent_skills__agent_id___skill_id__delete",
        "parameters": [
          {
            "name": "agent_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "title": "Agent Id"
            }
          },
          {
            "name": "skill_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "title": "Skill Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/agent-status-events": {
      "post": {
        "summary": "Create Status Event Api",
        "description": "Create a new status event",
        "operationId": "create_status_event_api_api_agent_status_events_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/AgentStatusEventCreateRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/agents/{agent_id}/status-events": {
      "get": {
        "summary": "Get Agent Status Events Api",
        "description": "Get status events for an agent",
        "operationId": "get_agent_status_events_api_api_agents__agent_id__status_events_get",
        "parameters": [
          {
            "name": "agent_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "title": "Agent Id"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Maximum number of events to return",
              "default": 100,
              "title": "Limit"
            },
            "description": "Maximum number of events to return"
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/agents/{agent_id}/current-status": {
      "get": {
        "summary": "Get Current Agent Status Api",
        "description": "Get current status for an agent",
        "operationId": "get_current_agent_status_api_api_agents__agent_id__current_status_get",
        "parameters": [
          {
            "name": "agent_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "title": "Agent Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/agent-login": {
      "post": {
        "summary": "Agent Login",
        "operationId": "agent_login_api_agent_login_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/LoginRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        },
        "security": [
          {
            "OAuth2PasswordBearer": []
          }
        ]
      }
    },
    "/api/conversations": {
      "post": {
        "summary": "Create Conversation Api",
        "description": "Create a new conversation",
        "operationId": "create_conversation_api_api_conversations_post",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ConversationCreateRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "get": {
        "summary": "Get All Conversations Api",
        "description": "Get all conversations",
        "operationId": "get_all_conversations_api_api_conversations_get",
        "parameters": [
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Maximum number of conversations to return",
              "default": 50,
              "title": "Limit"
            },
            "description": "Maximum number of conversations to return"
          },
          {
            "name": "offset",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Number of conversations to skip",
              "default": 0,
              "title": "Offset"
            },
            "description": "Number of conversations to skip"
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "put": {
        "summary": "Update Conversation Api",
        "description": "Update a conversation",
        "operationId": "update_conversation_api_api_conversations_put",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ConversationUpdateRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/conversations/{conversation_id}": {
      "get": {
        "summary": "Get Conversation Api",
        "description": "Get conversation by ID",
        "operationId": "get_conversation_api_api_conversations__conversation_id__get",
        "parameters": [
          {
            "name": "conversation_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "title": "Conversation Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "Delete Conversation Api",
        "description": "Delete a conversation",
        "operationId": "delete_conversation_api_api_conversations__conversation_id__delete",
        "parameters": [
          {
            "name": "conversation_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "title": "Conversation Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/conversations/by-session/{session_id}": {
      "get": {
        "summary": "Get Conversation By Session Api",
        "description": "Get conversation by session ID",
        "operationId": "get_conversation_by_session_api_api_conversations_by_session__session_id__get",
        "parameters": [
          {
            "name": "session_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "Session Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/conversations/by-user/{user_id}": {
      "get": {
        "summary": "Get Conversations By User Api",
        "description": "Get conversations by user ID",
        "operationId": "get_conversations_by_user_api_api_conversations_by_user__user_id__get",
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "title": "User Id"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Maximum number of conversations to return",
              "default": 50,
              "title": "Limit"
            },
            "description": "Maximum number of conversations to return"
          },
          {
            "name": "offset",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Number of conversations to skip",
              "default": 0,
              "title": "Offset"
            },
            "description": "Number of conversations to skip"
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/conversation-details": {
      "post": {
        "summary": "Create Conversation Detail Api",
        "description": "Create a new conversation detail or multiple conversation details in bulk",
        "operationId": "create_conversation_detail_api_api_conversation_details_post",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "anyOf": [
                  {
                    "$ref": "#/components/schemas/ConversationDetailCreateRequest"
                  },
                  {
                    "type": "array",
                    "items": {
                      "$ref": "#/components/schemas/ConversationDetailCreateRequest"
                    }
                  },
                  {
                    "$ref": "#/components/schemas/ConversationDetailBulkCreateRequest"
                  }
                ],
                "title": "Request"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "get": {
        "summary": "Get Conversation Details With Filters Api",
        "description": "Get conversation details with advanced filtering",
        "operationId": "get_conversation_details_with_filters_api_api_conversation_details_get",
        "parameters": [
          {
            "name": "fkConvId",
            "in": "query",
            "required": false,
            "schema": {
              "anyOf": [
                {
                  "type": "integer"
                },
                {
                  "type": "null"
                }
              ],
              "description": "Filter by conversation ID",
              "title": "Fkconvid"
            },
            "description": "Filter by conversation ID"
          },
          {
            "name": "user_id",
            "in": "query",
            "required": false,
            "schema": {
              "anyOf": [
                {
                  "type": "string"
                },
                {
                  "type": "null"
                }
              ],
              "description": "Filter by user ID",
              "title": "User Id"
            },
            "description": "Filter by user ID"
          },
          {
            "name": "agent_id",
            "in": "query",
            "required": false,
            "schema": {
              "anyOf": [
                {
                  "type": "integer"
                },
                {
                  "type": "null"
                }
              ],
              "description": "Filter by agent ID",
              "title": "Agent Id"
            },
            "description": "Filter by agent ID"
          },
          {
            "name": "category",
            "in": "query",
            "required": false,
            "schema": {
              "anyOf": [
                {
                  "type": "string"
                },
                {
                  "type": "null"
                }
              ],
              "description": "Filter by category",
              "title": "Category"
            },
            "description": "Filter by category"
          },
          {
            "name": "responder_type",
            "in": "query",
            "required": false,
            "schema": {
              "anyOf": [
                {
                  "type": "string"
                },
                {
                  "type": "null"
                }
              ],
              "description": "Filter by responder type",
              "title": "Responder Type"
            },
            "description": "Filter by responder type"
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Maximum number of details to return",
              "default": 100,
              "title": "Limit"
            },
            "description": "Maximum number of details to return"
          },
          {
            "name": "offset",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Number of details to skip",
              "default": 0,
              "title": "Offset"
            },
            "description": "Number of details to skip"
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "put": {
        "summary": "Update Conversation Detail Api",
        "description": "Update a conversation detail",
        "operationId": "update_conversation_detail_api_api_conversation_details_put",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ConversationDetailUpdateRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/conversation-details/{detail_id}": {
      "get": {
        "summary": "Get Conversation Detail Api",
        "description": "Get conversation detail by ID",
        "operationId": "get_conversation_detail_api_api_conversation_details__detail_id__get",
        "parameters": [
          {
            "name": "detail_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "title": "Detail Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "Delete Conversation Detail Api",
        "description": "Delete a conversation detail",
        "operationId": "delete_conversation_detail_api_api_conversation_details__detail_id__delete",
        "parameters": [
          {
            "name": "detail_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "title": "Detail Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/conversations/{conversation_id}/details": {
      "get": {
        "summary": "Get Conversation Details By Conversation Api",
        "description": "Get conversation details by conversation ID",
        "operationId": "get_conversation_details_by_conversation_api_api_conversations__conversation_id__details_get",
        "parameters": [
          {
            "name": "conversation_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "title": "Conversation Id"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Maximum number of details to return",
              "default": 100,
              "title": "Limit"
            },
            "description": "Maximum number of details to return"
          },
          {
            "name": "offset",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Number of details to skip",
              "default": 0,
              "title": "Offset"
            },
            "description": "Number of details to skip"
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/conversation-details/by-user/{user_id}": {
      "get": {
        "summary": "Get Conversation Details By User Api",
        "description": "Get conversation details by user ID",
        "operationId": "get_conversation_details_by_user_api_api_conversation_details_by_user__user_id__get",
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "User Id"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Maximum number of details to return",
              "default": 100,
              "title": "Limit"
            },
            "description": "Maximum number of details to return"
          },
          {
            "name": "offset",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Number of details to skip",
              "default": 0,
              "title": "Offset"
            },
            "description": "Number of details to skip"
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/conversation-details/by-agent/{agent_id}": {
      "get": {
        "summary": "Get Conversation Details By Agent Api",
        "description": "Get conversation details by agent ID",
        "operationId": "get_conversation_details_by_agent_api_api_conversation_details_by_agent__agent_id__get",
        "parameters": [
          {
            "name": "agent_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "title": "Agent Id"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Maximum number of details to return",
              "default": 100,
              "title": "Limit"
            },
            "description": "Maximum number of details to return"
          },
          {
            "name": "offset",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Number of details to skip",
              "default": 0,
              "title": "Offset"
            },
            "description": "Number of details to skip"
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/tickets": {
      "post": {
        "summary": "Create Ticket Api",
        "description": "Create a new ticket",
        "operationId": "create_ticket_api_api_tickets_post",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/TicketCreateRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "get": {
        "summary": "Get All Tickets Api",
        "description": "Get all tickets",
        "operationId": "get_all_tickets_api_api_tickets_get",
        "parameters": [
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Maximum number of tickets to return",
              "default": 50,
              "title": "Limit"
            },
            "description": "Maximum number of tickets to return"
          },
          {
            "name": "offset",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Number of tickets to skip",
              "default": 0,
              "title": "Offset"
            },
            "description": "Number of tickets to skip"
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "put": {
        "summary": "Update Ticket Api",
        "description": "Update a ticket",
        "operationId": "update_ticket_api_api_tickets_put",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/TicketUpdateRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/tickets/{ticket_id}": {
      "get": {
        "summary": "Get Ticket Api",
        "description": "Get a ticket by ID",
        "operationId": "get_ticket_api_api_tickets__ticket_id__get",
        "parameters": [
          {
            "name": "ticket_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "Ticket Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "Delete Ticket Api",
        "description": "Delete a ticket",
        "operationId": "delete_ticket_api_api_tickets__ticket_id__delete",
        "parameters": [
          {
            "name": "ticket_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "Ticket Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/tickets/session/{session_id}": {
      "get": {
        "summary": "Get Tickets By Session Api",
        "description": "Get tickets by session ID",
        "operationId": "get_tickets_by_session_api_api_tickets_session__session_id__get",
        "parameters": [
          {
            "name": "session_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "Session Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/ticket-agents/{ticket_id}": {
      "get": {
        "summary": "Get Ticket Agents Api",
        "description": "Get all agents assigned to a ticket",
        "operationId": "get_ticket_agents_api_api_ticket_agents__ticket_id__get",
        "parameters": [
          {
            "name": "ticket_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "Ticket Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/ticket-agents": {
      "put": {
        "summary": "Update Ticket Agent Api",
        "description": "Update an agent's role or status for a ticket",
        "operationId": "update_ticket_agent_api_api_ticket_agents_put",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/TicketAgentUpdateRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/ticket-agents/{ticket_id}/{agent_id}": {
      "delete": {
        "summary": "Delete Ticket Agent Api",
        "description": "Remove an agent from a ticket",
        "operationId": "delete_ticket_agent_api_api_ticket_agents__ticket_id___agent_id__delete",
        "parameters": [
          {
            "name": "ticket_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "Ticket Id"
            }
          },
          {
            "name": "agent_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "title": "Agent Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/ticket-messages": {
      "put": {
        "summary": "Update Ticket Message Api",
        "description": "Update a ticket message",
        "operationId": "update_ticket_message_api_api_ticket_messages_put",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/TicketMessageUpdateRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Create Ticket Message Api",
        "description": "Create a new ticket message",
        "operationId": "create_ticket_message_api_api_ticket_messages_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/TicketMessageCreateRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/ticket-messages/{message_id}": {
      "get": {
        "summary": "Get Ticket Message Api",
        "description": "Get a single ticket message by ID",
        "operationId": "get_ticket_message_api_api_ticket_messages__message_id__get",
        "parameters": [
          {
            "name": "message_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "title": "Message Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "Delete Ticket Message Api",
        "description": "Delete a ticket message",
        "operationId": "delete_ticket_message_api_api_ticket_messages__message_id__delete",
        "parameters": [
          {
            "name": "message_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "title": "Message Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/ticket-messages/ticket/{ticket_id}": {
      "get": {
        "summary": "Get Ticket Messages By Ticket Api",
        "description": "Get messages for a ticket",
        "operationId": "get_ticket_messages_by_ticket_api_api_ticket_messages_ticket__ticket_id__get",
        "parameters": [
          {
            "name": "ticket_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "Ticket Id"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Maximum number of messages to return",
              "default": 50,
              "title": "Limit"
            },
            "description": "Maximum number of messages to return"
          },
          {
            "name": "offset",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Number of messages to skip",
              "default": 0,
              "title": "Offset"
            },
            "description": "Number of messages to skip"
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/ticket-feedback": {
      "put": {
        "summary": "Update Ticket Feedback Api",
        "description": "Update feedback",
        "operationId": "update_ticket_feedback_api_api_ticket_feedback_put",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/TicketFeedbackUpdateRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Create Ticket Feedback Api",
        "description": "Create feedback for a ticket",
        "operationId": "create_ticket_feedback_api_api_ticket_feedback_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/TicketFeedbackCreateRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/ticket-feedback/{feedback_id}": {
      "get": {
        "summary": "Get Ticket Feedback Api",
        "description": "Get a single feedback by ID",
        "operationId": "get_ticket_feedback_api_api_ticket_feedback__feedback_id__get",
        "parameters": [
          {
            "name": "feedback_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "title": "Feedback Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "Delete Ticket Feedback Api",
        "description": "Delete feedback",
        "operationId": "delete_ticket_feedback_api_api_ticket_feedback__feedback_id__delete",
        "parameters": [
          {
            "name": "feedback_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "title": "Feedback Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/ticket-feedback/ticket/{ticket_id}": {
      "get": {
        "summary": "Get Ticket Feedback By Ticket Api",
        "description": "Get feedback for a ticket",
        "operationId": "get_ticket_feedback_by_ticket_api_api_ticket_feedback_ticket__ticket_id__get",
        "parameters": [
          {
            "name": "ticket_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "Ticket Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/ticket-events/ticket/{ticket_id}": {
      "get": {
        "summary": "Get Ticket Events By Ticket Api",
        "description": "Get events for a specific ticket",
        "operationId": "get_ticket_events_by_ticket_api_api_ticket_events_ticket__ticket_id__get",
        "parameters": [
          {
            "name": "ticket_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "title": "Ticket Id"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Maximum number of events to return",
              "default": 50,
              "title": "Limit"
            },
            "description": "Maximum number of events to return"
          },
          {
            "name": "offset",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Number of events to skip",
              "default": 0,
              "title": "Offset"
            },
            "description": "Number of events to skip"
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "ActiveWorkflowResponse": {
        "properties": {
          "success": {
            "type": "boolean",
            "title": "Success"
          },
          "workflow_id": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Workflow Id"
          },
          "workflow_name": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Workflow Name"
          },
          "message": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Message"
          },
          "error": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Error"
          }
        },
        "type": "object",
        "required": [
          "success"
        ],
        "title": "ActiveWorkflowResponse"
      },
      "AgentCreateRequest": {
        "properties": {
          "username": {
            "type": "string",
            "title": "Username"
          },
          "display_name": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Display Name"
          },
          "email": {
            "type": "string",
            "title": "Email"
          },
          "password": {
            "type": "string",
            "title": "Password"
          },
          "is_active": {
            "anyOf": [
              {
                "type": "boolean"
              },
              {
                "type": "null"
              }
            ],
            "title": "Is Active",
            "default": true
          },
          "max_concurrent_chats": {
            "anyOf": [
              {
                "type": "integer"
              },
              {
                "type": "null"
              }
            ],
            "title": "Max Concurrent Chats",
            "default": 2
          },
          "role": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Role",
            "default": "agent"
          }
        },
        "type": "object",
        "required": [
          "username",
          "email",
          "password"
        ],
        "title": "AgentCreateRequest"
      },
      "AgentSkillCreateRequest": {
        "properties": {
          "agent_id": {
            "type": "integer",
            "title": "Agent Id"
          },
          "skill_id": {
            "type": "integer",
            "title": "Skill Id"
          },
          "proficiency": {
            "anyOf": [
              {
                "type": "integer"
              },
              {
                "type": "null"
              }
            ],
            "title": "Proficiency",
            "default": 5
          }
        },
        "type": "object",
        "required": [
          "agent_id",
          "skill_id"
        ],
        "title": "AgentSkillCreateRequest"
      },
      "AgentSkillUpdateRequest": {
        "properties": {
          "agent_id": {
            "type": "integer",
            "title": "Agent Id"
          },
          "skill_id": {
            "type": "integer",
            "title": "Skill Id"
          },
          "proficiency": {
            "type": "integer",
            "title": "Proficiency"
          }
        },
        "type": "object",
        "required": [
          "agent_id",
          "skill_id",
          "proficiency"
        ],
        "title": "AgentSkillUpdateRequest"
      },
      "AgentStatusEventCreateRequest": {
        "properties": {
          "agent_id": {
            "type": "integer",
            "title": "Agent Id"
          },
          "status": {
            "type": "string",
            "title": "Status"
          },
          "concurrent_load": {
            "anyOf": [
              {
                "type": "integer"
              },
              {
                "type": "null"
              }
            ],
            "title": "Concurrent Load",
            "default": 0
          },
          "details": {
            "anyOf": [
              {
                "type": "object"
              },
              {
                "type": "null"
              }
            ],
            "title": "Details"
          }
        },
        "type": "object",
        "required": [
          "agent_id",
          "status"
        ],
        "title": "AgentStatusEventCreateRequest"
      },
      "AgentUpdateRequest": {
        "properties": {
          "id": {
            "type": "integer",
            "title": "Id"
          },
          "username": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Username"
          },
          "display_name": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Display Name"
          },
          "email": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Email"
          },
          "password": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Password"
          },
          "is_active": {
            "anyOf": [
              {
                "type": "boolean"
              },
              {
                "type": "null"
              }
            ],
            "title": "Is Active"
          },
          "max_concurrent_chats": {
            "anyOf": [
              {
                "type": "integer"
              },
              {
                "type": "null"
              }
            ],
            "title": "Max Concurrent Chats"
          },
          "role": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Role"
          }
        },
        "type": "object",
        "required": [
          "id"
        ],
        "title": "AgentUpdateRequest"
      },
      "Body_create_token_token_post": {
        "properties": {
          "request": {
            "type": "object",
            "title": "Request"
          },
          "grant_type": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "password"
              },
              {
                "type": "null"
              }
            ],
            "title": "Grant Type"
          },
          "username": {
            "type": "string",
            "title": "Username"
          },
          "password": {
            "type": "string",
            "title": "Password"
          },
          "scope": {
            "type": "string",
            "title": "Scope",
            "default": ""
          },
          "client_id": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Client Id"
          },
          "client_secret": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Client Secret"
          }
        },
        "type": "object",
        "required": [
          "username",
          "password"
        ],
        "title": "Body_create_token_token_post"
      },
      "ConversationCreateRequest": {
        "properties": {
          "user_id": {
            "anyOf": [
              {
                "type": "integer"
              },
              {
                "type": "null"
              }
            ],
            "title": "User Id"
          },
          "session_id": {
            "type": "string",
            "title": "Session Id"
          },
          "metadata": {
            "anyOf": [
              {
                "type": "object"
              },
              {
                "type": "null"
              }
            ],
            "title": "Metadata"
          },
          "browser": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Browser"
          },
          "ip_address": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Ip Address"
          },
          "start_time": {
            "anyOf": [
              {
                "type": "string",
                "format": "date-time"
              },
              {
                "type": "null"
              }
            ],
            "title": "Start Time"
          }
        },
        "type": "object",
        "required": [
          "session_id"
        ],
        "title": "ConversationCreateRequest"
      },
      "ConversationDetailBulkCreateRequest": {
        "properties": {
          "details": {
            "items": {
              "$ref": "#/components/schemas/ConversationDetailCreateRequest"
            },
            "type": "array",
            "title": "Details"
          }
        },
        "type": "object",
        "required": [
          "details"
        ],
        "title": "ConversationDetailBulkCreateRequest"
      },
      "ConversationDetailCreateRequest": {
        "properties": {
          "fkConvId": {
            "anyOf": [
              {
                "type": "integer"
              },
              {
                "type": "null"
              }
            ],
            "title": "Fkconvid"
          },
          "user_id": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "User Id"
          },
          "agent_id": {
            "anyOf": [
              {
                "type": "integer"
              },
              {
                "type": "null"
              }
            ],
            "title": "Agent Id"
          },
          "prompt": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Prompt"
          },
          "output": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Output"
          },
          "responder_type": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Responder Type",
            "default": "system"
          },
          "category": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Category"
          },
          "search_params": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Search Params"
          },
          "result_list": {
            "anyOf": [
              {
                "items": {
                  "type": "object"
                },
                "type": "array"
              },
              {
                "type": "null"
              }
            ],
            "title": "Result List"
          },
          "attachments": {
            "anyOf": [
              {
                "items": {
                  "type": "object"
                },
                "type": "array"
              },
              {
                "type": "null"
              }
            ],
            "title": "Attachments"
          },
          "metadata": {
            "anyOf": [
              {
                "type": "object"
              },
              {
                "type": "null"
              }
            ],
            "title": "Metadata"
          }
        },
        "type": "object",
        "title": "ConversationDetailCreateRequest"
      },
      "ConversationDetailUpdateRequest": {
        "properties": {
          "id": {
            "type": "integer",
            "title": "Id"
          },
          "fkConvId": {
            "anyOf": [
              {
                "type": "integer"
              },
              {
                "type": "null"
              }
            ],
            "title": "Fkconvid"
          },
          "user_id": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "User Id"
          },
          "agent_id": {
            "anyOf": [
              {
                "type": "integer"
              },
              {
                "type": "null"
              }
            ],
            "title": "Agent Id"
          },
          "prompt": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Prompt"
          },
          "output": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Output"
          },
          "responder_type": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Responder Type"
          },
          "category": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Category"
          },
          "search_params": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Search Params"
          },
          "result_list": {
            "anyOf": [
              {
                "items": {
                  "type": "object"
                },
                "type": "array"
              },
              {
                "type": "null"
              }
            ],
            "title": "Result List"
          },
          "attachments": {
            "anyOf": [
              {
                "items": {
                  "type": "object"
                },
                "type": "array"
              },
              {
                "type": "null"
              }
            ],
            "title": "Attachments"
          },
          "metadata": {
            "anyOf": [
              {
                "type": "object"
              },
              {
                "type": "null"
              }
            ],
            "title": "Metadata"
          }
        },
        "type": "object",
        "required": [
          "id"
        ],
        "title": "ConversationDetailUpdateRequest"
      },
      "ConversationUpdateRequest": {
        "properties": {
          "id": {
            "type": "integer",
            "title": "Id"
          },
          "user_id": {
            "anyOf": [
              {
                "type": "integer"
              },
              {
                "type": "null"
              }
            ],
            "title": "User Id"
          },
          "session_id": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Session Id"
          },
          "metadata": {
            "anyOf": [
              {
                "type": "object"
              },
              {
                "type": "null"
              }
            ],
            "title": "Metadata"
          },
          "browser": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Browser"
          },
          "ip_address": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Ip Address"
          },
          "start_time": {
            "anyOf": [
              {
                "type": "string",
                "format": "date-time"
              },
              {
                "type": "null"
              }
            ],
            "title": "Start Time"
          },
          "end_time": {
            "anyOf": [
              {
                "type": "string",
                "format": "date-time"
              },
              {
                "type": "null"
              }
            ],
            "title": "End Time"
          }
        },
        "type": "object",
        "required": [
          "id"
        ],
        "title": "ConversationUpdateRequest"
      },
      "HTTPValidationError": {
        "properties": {
          "detail": {
            "items": {
              "$ref": "#/components/schemas/ValidationError"
            },
            "type": "array",
            "title": "Detail"
          }
        },
        "type": "object",
        "title": "HTTPValidationError"
      },
      "LoginRequest": {
        "properties": {
          "username": {
            "type": "string",
            "title": "Username"
          },
          "password": {
            "type": "string",
            "title": "Password"
          }
        },
        "type": "object",
        "required": [
          "username",
          "password"
        ],
        "title": "LoginRequest"
      },
      "NodeData": {
        "properties": {
          "id": {
            "type": "string",
            "title": "Id"
          },
          "type": {
            "type": "string",
            "title": "Type"
          },
          "label": {
            "type": "string",
            "title": "Label"
          },
          "question_text": {
            "type": "string",
            "title": "Question Text"
          },
          "position_x": {
            "type": "integer",
            "title": "Position X"
          },
          "position_y": {
            "type": "integer",
            "title": "Position Y"
          },
          "options_json": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Options Json"
          },
          "next_nodes_json": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Next Nodes Json"
          },
          "order_index": {
            "type": "integer",
            "title": "Order Index"
          },
          "workflow_id": {
            "type": "string",
            "title": "Workflow Id"
          },
          "created_at": {
            "type": "string",
            "title": "Created At"
          }
        },
        "type": "object",
        "required": [
          "id",
          "type",
          "label",
          "question_text",
          "position_x",
          "position_y",
          "order_index",
          "workflow_id",
          "created_at"
        ],
        "title": "NodeData"
      },
      "QueryRequest": {
        "properties": {
          "user_id": {
            "type": "string",
            "title": "User Id"
          },
          "prompt": {
            "type": "string",
            "title": "Prompt"
          },
          "property_data": {
            "type": "object",
            "title": "Property Data"
          }
        },
        "type": "object",
        "required": [
          "user_id",
          "prompt"
        ],
        "title": "QueryRequest"
      },
      "SaveWorkflowRequest": {
        "properties": {
          "workflow_id": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Workflow Id"
          },
          "workflow_name": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Workflow Name"
          },
          "nodes": {
            "items": {
              "$ref": "#/components/schemas/NodeData"
            },
            "type": "array",
            "title": "Nodes"
          }
        },
        "type": "object",
        "required": [
          "nodes"
        ],
        "title": "SaveWorkflowRequest"
      },
      "SaveWorkflowResponse": {
        "properties": {
          "success": {
            "type": "boolean",
            "title": "Success"
          },
          "workflow_id": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Workflow Id"
          },
          "message": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Message"
          },
          "error": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Error"
          }
        },
        "type": "object",
        "required": [
          "success"
        ],
        "title": "SaveWorkflowResponse"
      },
      "SequenceCreateGroupandItem": {
        "properties": {
          "name": {
            "type": "string",
            "title": "Name"
          },
          "description": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Description"
          },
          "items": {
            "items": {
              "$ref": "#/components/schemas/SequenceItemforNewGroup"
            },
            "type": "array",
            "title": "Items",
            "default": []
          }
        },
        "type": "object",
        "required": [
          "name"
        ],
        "title": "SequenceCreateGroupandItem"
      },
      "SequenceItemforNewGroup": {
        "properties": {
          "item_name": {
            "type": "string",
            "title": "Item Name"
          },
          "item_sequence_position": {
            "type": "integer",
            "title": "Item Sequence Position"
          },
          "item_response_type": {
            "type": "string",
            "title": "Item Response Type"
          },
          "options": {
            "type": "object",
            "title": "Options"
          },
          "req_parameters": {
            "type": "object",
            "title": "Req Parameters"
          }
        },
        "type": "object",
        "required": [
          "item_name",
          "item_sequence_position",
          "item_response_type",
          "options",
          "req_parameters"
        ],
        "title": "SequenceItemforNewGroup"
      },
      "SequenceItemforOldGroup": {
        "properties": {
          "group_id": {
            "type": "integer",
            "title": "Group Id"
          },
          "items": {
            "items": {
              "$ref": "#/components/schemas/SequenceItemforNewGroup"
            },
            "type": "array",
            "title": "Items",
            "default": []
          }
        },
        "type": "object",
        "required": [
          "group_id"
        ],
        "title": "SequenceItemforOldGroup"
      },
      "SetActiveWorkflowRequest": {
        "properties": {
          "workflow_id": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Workflow Id"
          },
          "workflow_name": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Workflow Name"
          }
        },
        "type": "object",
        "title": "SetActiveWorkflowRequest"
      },
      "SkillCreateRequest": {
        "properties": {
          "name": {
            "type": "string",
            "title": "Name"
          }
        },
        "type": "object",
        "required": [
          "name"
        ],
        "title": "SkillCreateRequest"
      },
      "SkillUpdateRequest": {
        "properties": {
          "id": {
            "type": "integer",
            "title": "Id"
          },
          "name": {
            "type": "string",
            "title": "Name"
          }
        },
        "type": "object",
        "required": [
          "id",
          "name"
        ],
        "title": "SkillUpdateRequest"
      },
      "TicketAgentUpdateRequest": {
        "properties": {
          "ticket_id": {
            "type": "string",
            "title": "Ticket Id"
          },
          "assigned_agent_id": {
            "type": "integer",
            "title": "Assigned Agent Id"
          },
          "title": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Title"
          },
          "description": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Description"
          },
          "status": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Status"
          },
          "priority": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Priority"
          },
          "actor_id": {
            "anyOf": [
              {
                "type": "integer"
              },
              {
                "type": "null"
              }
            ],
            "title": "Actor Id"
          }
        },
        "type": "object",
        "required": [
          "ticket_id",
          "assigned_agent_id"
        ],
        "title": "TicketAgentUpdateRequest"
      },
      "TicketCreateRequest": {
        "properties": {
          "session_id": {
            "type": "string",
            "title": "Session Id"
          },
          "user_id": {
            "anyOf": [
              {
                "type": "integer"
              },
              {
                "type": "null"
              }
            ],
            "title": "User Id"
          },
          "title": {
            "type": "string",
            "title": "Title"
          },
          "description": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Description"
          },
          "category": {
            "type": "string",
            "title": "Category",
            "default": "general"
          },
          "priority": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Priority",
            "default": "medium"
          },
          "status": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Status",
            "default": "waiting"
          }
        },
        "type": "object",
        "required": [
          "session_id",
          "title"
        ],
        "title": "TicketCreateRequest"
      },
      "TicketFeedbackCreateRequest": {
        "properties": {
          "ticket_id": {
            "type": "string",
            "title": "Ticket Id"
          },
          "rating": {
            "type": "integer",
            "title": "Rating"
          },
          "comment": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Comment"
          }
        },
        "type": "object",
        "required": [
          "ticket_id",
          "rating"
        ],
        "title": "TicketFeedbackCreateRequest"
      },
      "TicketFeedbackUpdateRequest": {
        "properties": {
          "ticket_id": {
            "type": "string",
            "title": "Ticket Id"
          },
          "rating": {
            "anyOf": [
              {
                "type": "integer"
              },
              {
                "type": "null"
              }
            ],
            "title": "Rating"
          },
          "comment": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Comment"
          }
        },
        "type": "object",
        "required": [
          "ticket_id"
        ],
        "title": "TicketFeedbackUpdateRequest"
      },
      "TicketMessageCreateRequest": {
        "properties": {
          "ticket_id": {
            "type": "string",
            "title": "Ticket Id"
          },
          "sender_id": {
            "type": "string",
            "title": "Sender Id"
          },
          "sender_type": {
            "type": "string",
            "title": "Sender Type",
            "default": "agent"
          },
          "content": {
            "type": "string",
            "title": "Content"
          },
          "attachments": {
            "anyOf": [
              {
                "items": {
                  "type": "object"
                },
                "type": "array"
              },
              {
                "type": "null"
              }
            ],
            "title": "Attachments"
          },
          "metadata": {
            "anyOf": [
              {
                "type": "object"
              },
              {
                "type": "null"
              }
            ],
            "title": "Metadata"
          }
        },
        "type": "object",
        "required": [
          "ticket_id",
          "sender_id",
          "content"
        ],
        "title": "TicketMessageCreateRequest"
      },
      "TicketMessageUpdateRequest": {
        "properties": {
          "id": {
            "type": "integer",
            "title": "Id"
          },
          "content": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Content"
          },
          "attachments": {
            "anyOf": [
              {
                "items": {
                  "type": "object"
                },
                "type": "array"
              },
              {
                "type": "null"
              }
            ],
            "title": "Attachments"
          },
          "metadata": {
            "anyOf": [
              {
                "type": "object"
              },
              {
                "type": "null"
              }
            ],
            "title": "Metadata"
          }
        },
        "type": "object",
        "required": [
          "id"
        ],
        "title": "TicketMessageUpdateRequest"
      },
      "TicketUpdateRequest": {
        "properties": {
          "id": {
            "type": "string",
            "title": "Id"
          },
          "title": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Title"
          },
          "description": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Description"
          },
          "category": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Category"
          },
          "priority": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Priority"
          },
          "status": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Status"
          }
        },
        "type": "object",
        "required": [
          "id"
        ],
        "title": "TicketUpdateRequest"
      },
      "TokenRequest": {
        "properties": {
          "refresh_token": {
            "type": "string",
            "title": "Refresh Token"
          }
        },
        "type": "object",
        "required": [
          "refresh_token"
        ],
        "title": "TokenRequest"
      },
      "UpdateSequencePositionRequest": {
        "properties": {
          "group_id": {
            "type": "integer",
            "title": "Group Id"
          },
          "old_position": {
            "type": "integer",
            "title": "Old Position"
          },
          "new_position": {
            "type": "integer",
            "title": "New Position"
          }
        },
        "type": "object",
        "required": [
          "group_id",
          "old_position",
          "new_position"
        ],
        "title": "UpdateSequencePositionRequest"
      },
      "ValidationError": {
        "properties": {
          "loc": {
            "items": {
              "anyOf": [
                {
                  "type": "string"
                },
                {
                  "type": "integer"
                }
              ]
            },
            "type": "array",
            "title": "Location"
          },
          "msg": {
            "type": "string",
            "title": "Message"
          },
          "type": {
            "type": "string",
            "title": "Error Type"
          }
        },
        "type": "object",
        "required": [
          "loc",
          "msg",
          "type"
        ],
        "title": "ValidationError"
      },
      "deleteSequenceGroup": {
        "properties": {
          "group_id": {
            "type": "integer",
            "title": "Group Id"
          }
        },
        "type": "object",
        "required": [
          "group_id"
        ],
        "title": "deleteSequenceGroup"
      },
      "deleteSequenceItem": {
        "properties": {
          "item_id": {
            "type": "integer",
            "title": "Item Id"
          }
        },
        "type": "object",
        "required": [
          "item_id"
        ],
        "title": "deleteSequenceItem"
      },
      "updateSequenceGroup": {
        "properties": {
          "group_id": {
            "type": "integer",
            "title": "Group Id"
          },
          "group_name": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Group Name"
          },
          "group_description": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Group Description"
          }
        },
        "type": "object",
        "required": [
          "group_id"
        ],
        "title": "updateSequenceGroup"
      },
      "updateSequenceItem": {
        "properties": {
          "item_id": {
            "type": "integer",
            "title": "Item Id"
          },
          "item_name": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Item Name"
          },
          "item_sequence_position": {
            "anyOf": [
              {
                "type": "integer"
              },
              {
                "type": "null"
              }
            ],
            "title": "Item Sequence Position"
          },
          "item_response_type": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Item Response Type"
          },
          "options": {
            "anyOf": [
              {
                "type": "object"
              },
              {
                "type": "null"
              }
            ],
            "title": "Options"
          },
          "req_parameters": {
            "anyOf": [
              {
                "type": "object"
              },
              {
                "type": "null"
              }
            ],
            "title": "Req Parameters"
          }
        },
        "type": "object",
        "required": [
          "item_id"
        ],
        "title": "updateSequenceItem"
      }
    },
    "securitySchemes": {
      "OAuth2PasswordBearer": {
        "type": "oauth2",
        "flows": {
          "password": {
            "scopes": {

            },
            "tokenUrl": "token"
          }
        }
      }
    }
  }
}