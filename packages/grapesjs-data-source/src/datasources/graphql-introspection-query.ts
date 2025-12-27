export default `
  query IntrospectionQuery {
    __schema {
      queryType {
        name
      }
      types {
        ...FullType
      }
    }
  }
  fragment FullType on __Type {
    kind
    name
    description
    fields(includeDeprecated: false) {
      name
      description
      args {
        ...InputValue
      }
      type {
        ...TypeRef
      }
    }
    inputFields {
      ...InputValue
    }
    interfaces {
      ...TypeRef
    }
    enumValues(includeDeprecated: false) {
      name
      description
    }
    possibleTypes {
      ...TypeRef
    }
  }
  fragment InputValue on __InputValue {
    name
    description
    type {
      ...TypeRef
    }
    defaultValue
  }
  fragment TypeRef on __Type {
    kind
    name
    possibleTypes {
      kind
      name
    }
    ofType {
      kind
      name
      possibleTypes {
        kind
        name
      }
      ofType {
        kind
        name
        possibleTypes {
          kind
          name
        }
        ofType {
          kind
          name
          possibleTypes {
            kind
            name
          }
          ofType {
            kind
            name
            possibleTypes {
              kind
              name
            }
            ofType {
              kind
              name
              possibleTypes {
                kind
                name
              }
              ofType {
                kind
                name
                possibleTypes {
                  kind
                  name
                }
                ofType {
                  kind
                  name
                  possibleTypes {
                    kind
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`