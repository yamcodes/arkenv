# GitHub CLI reference

## Repo management

- `gh repo view`: View repository info.
- `gh repo clone <repo>`: Clone a repository.
- `gh repo fork`: Fork a repository.

## Workflow & runs

- `gh run list --workflow <file-or-id>`: Filter runs by workflow.
- `gh run download <run-id>`: Download artifacts.
- `gh run watch <run-id>`: Watch a run until it completes.

## Secrets & variables

- `gh secret list`: List repository secrets.
- `gh secret set <name> --body <value>`: Set a secret.
- `gh variable list`: List repository variables.

## Search

- `gh search issues <query>`: Search for issues.
- `gh search prs <query>`: Search for pull requests.
