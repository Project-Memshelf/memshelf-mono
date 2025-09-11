## changes to be made

1. redo api schema with workspaces/:workspaceId/notes/:noteId
2. remove integration tests and favor unit tests first
3. use middleware for workspace permissions
4. create uri aware db connection and dev swapping
5. separate DB logger visibility
6. move http-server reusable code to shared-services

## review and merge

1. new error DB error aware Error Handler and tests
2. integration tests database config
3. integration tests api helpers
4. new tag entity validation rules
5. pino pretty in test mode