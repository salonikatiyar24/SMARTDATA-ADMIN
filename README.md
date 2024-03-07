# Configuration

## Environment Variables
| KEY                 | VALUE                                |
|---------------------|--------------------------------------|
| AZURE_TENANT_ID     | a1b2c3d4-e5f6-g7h8-i9j0-abcdef123456 |
| AZURE_KEYVAULT_NAME | NAME-OF-KEYVAULT                     |

## Python Packages
Run one of these code blocks in a terminal depending on if your package manager is pip or conda

PIP
```
pip install -r requirements.txt
```

Conda
```
conda install --file requirements.txt
```

# Usage
* On launch, Microsoft Authentication will launch in browser and a new window will also open at http://localhost:5000
## Firewall Rule Manager
* Current Firewall rules are "refreshed" every time the page reloads
* Operations include "Add", "Update", and "Delete"
* Validations
  * Two firewall rules cannot share the same name
  * IP addresses must follow the format 111.222.333.444
* "Commit Firewall Rules" will update the servers firewall rules and sync that change to Microsoft Cloud Defender Baseline
## SFTP User Manager
* SFTP users can be created, updated, delted or restored
* Deleted users can be restored up to 30 days past the deletion date
* Creating a new user will fail if:
  * The user name already exists
  * The user name is the name of a currently deleted user
* A user name cannot be modified, a new user must be created
* In the "Create User" or "Edit User" popup:
  * Passwords can be generated with the 🖉 icon
  * Passwords can be shown/hidden with the 👁 icon
* When retrieving a password:
  * The response will be a link to OneTimeSecret
  * Secrets can be further hidden with a "passcode"
  * Secrets will expire after 7 days
## Logger
* Review a list of change actions that have been generated by this application.
* One log file is generated per day (when activity happens)
* Activity is recorded for _all_ users