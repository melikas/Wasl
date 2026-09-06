const fs = require('fs');
const yaml = require('js-yaml');
const doc = yaml.load(fs.readFileSync('/home/runner/workspace/lib/api-spec/openapi.yaml', 'utf8'));

doc.components.schemas.Profile.properties.permissions = {
  $ref: '#/components/schemas/PermissionGrant'
};

fs.writeFileSync('/home/runner/workspace/lib/api-spec/openapi.yaml', yaml.dump(doc));
