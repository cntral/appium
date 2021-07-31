"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.CLIENT_URL_TYPES = exports.validator = void 0;

require("source-map-support/register");

var _validate = _interopRequireDefault(require("validate.js"));

var _lodash = _interopRequireDefault(require("lodash"));

_validate.default.validators.array = function array(value, options, key, attributes) {
  if (attributes[key] && !_validate.default.isArray(attributes[key])) {
    return `must be an array`;
  }
};

_validate.default.validators.hasAttributes = function hasAttributes(value, options) {
  if (!value) {
    return;
  }

  if (!_lodash.default.isArray(value)) {
    value = [value];
  }

  for (const item of value) {
    for (const option of options) {
      if (_lodash.default.isUndefined(item[option])) {
        return `must have attributes: ${options}`;
      }
    }
  }
};

_validate.default.validators.hasPossibleAttributes = function hasPossibleAttributes(value, options) {
  if (!value) {
    return;
  }

  if (!_lodash.default.isArray(value)) {
    return;
  }

  for (const item of value) {
    for (const key of _lodash.default.keys(item)) {
      if (!options.includes(key)) {
        return `must not include '${key}'. Available options: ${options}`;
      }
    }
  }
};

const CLIENT_URL_TYPES = {
  url: 'hostname',
  android: 'Android',
  ios: 'iOS'
};
exports.CLIENT_URL_TYPES = CLIENT_URL_TYPES;
const validator = {
  'name': {
    presence: true
  },
  'short_description': {
    presence: true
  },
  'example_usage': {},
  'example_usage.java': {},
  'example_usage.javascript_wdio': {},
  'example_usage.javascript_wd': {},
  'example_usage.ruby': {},
  'example_usage.ruby_core': {},
  'example_usage.csharp': {},
  'description': {},
  'client_docs.java': {
    hasPossibleAttributes: _lodash.default.keys(CLIENT_URL_TYPES)
  },
  'client_docs.javascript_wdio': {
    hasPossibleAttributes: _lodash.default.keys(CLIENT_URL_TYPES)
  },
  'client_docs.javascript_wd': {
    hasPossibleAttributes: _lodash.default.keys(CLIENT_URL_TYPES)
  },
  'client_docs.ruby': {
    hasPossibleAttributes: _lodash.default.keys(CLIENT_URL_TYPES)
  },
  'client_docs.ruby_core': {
    hasPossibleAttributes: _lodash.default.keys(CLIENT_URL_TYPES)
  },
  'client_docs.csharp': {
    hasPossibleAttributes: _lodash.default.keys(CLIENT_URL_TYPES)
  },
  'endpoint': {
    presence: true
  },
  'driver_support': {
    presence: true
  },
  'endpoint.url': {
    presence: true
  },
  'endpoint.url_parameters': {
    array: true,
    hasAttributes: ['name', 'description']
  },
  'endpoint.json_parameters': {
    array: true,
    hasAttributes: ['name', 'description']
  },
  'endpoint.response': {
    hasAttributes: ['type', 'description']
  },
  'specifications': {
    presence: true
  },
  'links': {
    array: true,
    hasAttributes: ['name', 'url']
  }
};
exports.validator = validator;
var _default = validator;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1hbmRzLXltbC92YWxpZGF0b3IuanMiXSwibmFtZXMiOlsidmFsaWRhdGUiLCJ2YWxpZGF0b3JzIiwiYXJyYXkiLCJ2YWx1ZSIsIm9wdGlvbnMiLCJrZXkiLCJhdHRyaWJ1dGVzIiwiaXNBcnJheSIsImhhc0F0dHJpYnV0ZXMiLCJfIiwiaXRlbSIsIm9wdGlvbiIsImlzVW5kZWZpbmVkIiwiaGFzUG9zc2libGVBdHRyaWJ1dGVzIiwia2V5cyIsImluY2x1ZGVzIiwiQ0xJRU5UX1VSTF9UWVBFUyIsInVybCIsImFuZHJvaWQiLCJpb3MiLCJ2YWxpZGF0b3IiLCJwcmVzZW5jZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFHQUEsa0JBQVNDLFVBQVQsQ0FBb0JDLEtBQXBCLEdBQTRCLFNBQVNBLEtBQVQsQ0FBZ0JDLEtBQWhCLEVBQXVCQyxPQUF2QixFQUFnQ0MsR0FBaEMsRUFBcUNDLFVBQXJDLEVBQWlEO0FBQzNFLE1BQUlBLFVBQVUsQ0FBQ0QsR0FBRCxDQUFWLElBQW1CLENBQUNMLGtCQUFTTyxPQUFULENBQWlCRCxVQUFVLENBQUNELEdBQUQsQ0FBM0IsQ0FBeEIsRUFBMkQ7QUFDekQsV0FBUSxrQkFBUjtBQUNEO0FBQ0YsQ0FKRDs7QUFNQUwsa0JBQVNDLFVBQVQsQ0FBb0JPLGFBQXBCLEdBQW9DLFNBQVNBLGFBQVQsQ0FBd0JMLEtBQXhCLEVBQStCQyxPQUEvQixFQUF3QztBQUMxRSxNQUFJLENBQUNELEtBQUwsRUFBWTtBQUNWO0FBQ0Q7O0FBRUQsTUFBSSxDQUFDTSxnQkFBRUYsT0FBRixDQUFVSixLQUFWLENBQUwsRUFBdUI7QUFDckJBLElBQUFBLEtBQUssR0FBRyxDQUFDQSxLQUFELENBQVI7QUFDRDs7QUFFRCxPQUFLLE1BQU1PLElBQVgsSUFBbUJQLEtBQW5CLEVBQTBCO0FBQ3hCLFNBQUssTUFBTVEsTUFBWCxJQUFxQlAsT0FBckIsRUFBOEI7QUFDNUIsVUFBSUssZ0JBQUVHLFdBQUYsQ0FBY0YsSUFBSSxD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QUFBQSxhQUFhLEVBQUUsQ0FBQyxNQUFELEVBQVMsS0FBVDtBQUE3QjtBQXhCTyxDQUFsQjs7ZUE2QmVZLFMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdmFsaWRhdGUgZnJvbSAndmFsaWRhdGUuanMnO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcblxuXG52YWxpZGF0ZS52YWxpZGF0b3JzLmFycmF5ID0gZnVuY3Rpb24gYXJyYXkgKHZhbHVlLCBvcHRpb25zLCBrZXksIGF0dHJpYnV0ZXMpIHtcbiAgaWYgKGF0dHJpYnV0ZXNba2V5XSAmJiAhdmFsaWRhdGUuaXNBcnJheShhdHRyaWJ1dGVzW2tleV0pKSB7XG4gICAgcmV0dXJuIGBtdXN0IGJlIGFuIGFycmF5YDtcbiAgfVxufTtcblxudmFsaWRhdGUudmFsaWRhdG9ycy5oYXNBdHRyaWJ1dGVzID0gZnVuY3Rpb24gaGFzQXR0cmlidXRlcyAodmFsdWUsIG9wdGlvbnMpIHtcbiAgaWYgKCF2YWx1ZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICghXy5pc0FycmF5KHZhbHVlKSkge1xuICAgIHZhbHVlID0gW3ZhbHVlXTtcbiAgfVxuXG4gIGZvciAoY29uc3QgaXRlbSBvZiB2YWx1ZSkge1xuICAgIGZvciAoY29uc3Qgb3B0aW9uIG9mIG9wdGlvbnMpIHtcbiAgICAgIGlmIChfLmlzVW5kZWZpbmVkKGl0ZW1bb3B0aW9uXSkpIHtcbiAgICAgICAgcmV0dXJuIGBtdXN0IGhhdmUgYXR0cmlidXRlczogJHtvcHRpb25zfWA7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG52YWxpZGF0ZS52YWxpZGF0b3JzLmhhc1Bvc3NpYmxlQXR0cmlidXRlcyA9IGZ1bmN0aW9uIGhhc1Bvc3NpYmxlQXR0cmlidXRlcyAodmFsdWUsIG9wdGlvbnMpIHtcbiAgaWYgKCF2YWx1ZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIGlmIGp1c3QgYSBiYXJlIHZhbHVlLCBhbGxvdyBpdCB0aHJvdWdoXG4gIGlmICghXy5pc0FycmF5KHZhbHVlKSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGZvciAoY29uc3QgaXRlbSBvZiB2YWx1ZSkge1xuICAgIGZvciAoY29uc3Qga2V5IG9mIF8ua2V5cyhpdGVtKSkge1xuICAgICAgaWYgKCFvcHRpb25zLmluY2x1ZGVzKGtleSkpIHtcbiAgICAgICAgcmV0dXJuIGBtdXN0IG5vdCBpbmNsdWRlICcke2tleX0nLiBBdmFpbGFibGUgb3B0aW9uczogJHtvcHRpb25zfWA7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5jb25zdCBDTElFTlRfVVJMX1RZUEVTID0ge1xuICB1cmw6ICdob3N0bmFtZScsXG4gIGFuZHJvaWQ6ICdBbmRyb2lkJyxcbiAgaW9zOiAnaU9TJyxcbn07XG5cbmNvbnN0IHZhbGlkYXRvciA9IHtcbiAgJ25hbWUnOiB7cHJlc2VuY2U6IHRydWV9LFxuICAnc2hvcnRfZGVzY3JpcHRpb24nOiB7cHJlc2VuY2U6IHRydWV9LFxuICAnZXhhbXBsZV91c2FnZSc6IHt9LFxuICAnZXhhbXBsZV91c2FnZS5qYXZhJzoge30sXG4gICdleGFtcGxlX3VzYWdlLmphdmFzY3JpcHRfd2Rpbyc6IHt9LFxuICAnZXhhbXBsZV91c2FnZS5qYXZhc2NyaXB0X3dkJzoge30sXG4gICdleGFtcGxlX3VzYWdlLnJ1YnknOiB7fSxcbiAgJ2V4YW1wbGVfdXNhZ2UucnVieV9jb3JlJzoge30sXG4gICdleGFtcGxlX3VzYWdlLmNzaGFycCc6IHt9LFxuICAnZGVzY3JpcHRpb24nOiB7fSxcbiAgJ2NsaWVudF9kb2NzLmphdmEnOiB7aGFzUG9zc2libGVBdHRyaWJ1dGVzOiBfLmtleXMoQ0xJRU5UX1VSTF9UWVBFUyl9LFxuICAnY2xpZW50X2RvY3MuamF2YXNjcmlwdF93ZGlvJzoge2hhc1Bvc3NpYmxlQXR0cmlidXRlczogXy5rZXlzKENMSUVOVF9VUkxfVFlQRVMpfSxcbiAgJ2NsaWVudF9kb2NzLmphdmFzY3JpcHRfd2QnOiB7aGFzUG9zc2libGVBdHRyaWJ1dGVzOiBfLmtleXMoQ0xJRU5UX1VSTF9UWVBFUyl9LFxuICAnY2xpZW50X2RvY3MucnVieSc6IHtoYXNQb3NzaWJsZUF0dHJpYnV0ZXM6IF8ua2V5cyhDTElFTlRfVVJMX1RZUEVTKX0sXG4gICdjbGllbnRfZG9jcy5ydWJ5X2NvcmUnOiB7aGFzUG9zc2libGVBdHRyaWJ1dGVzOiBfLmtleXMoQ0xJRU5UX1VSTF9UWVBFUyl9LFxuICAnY2xpZW50X2RvY3MuY3NoYXJwJzoge2hhc1Bvc3NpYmxlQXR0cmlidXRlczogXy5rZXlzKENMSUVOVF9VUkxfVFlQRVMpfSxcbiAgJ2VuZHBvaW50Jzoge3ByZXNlbmNlOiB0cnVlfSxcbiAgJ2RyaXZlcl9zdXBwb3J0Jzoge3ByZXNlbmNlOiB0cnVlfSxcbiAgJ2VuZHBvaW50LnVybCc6IHtwcmVzZW5jZTogdHJ1ZX0sXG4gICdlbmRwb2ludC51cmxfcGFyYW1ldGVycyc6IHthcnJheTogdHJ1ZSwgaGFzQXR0cmlidXRlczogWyduYW1lJywgJ2Rlc2NyaXB0aW9uJ119LFxuICAnZW5kcG9pbnQuanNvbl9wYXJhbWV0ZXJzJzoge2FycmF5OiB0cnVlLCBoYXNBdHRyaWJ1dGVzOiBbJ25hbWUnLCAnZGVzY3JpcHRpb24nXX0sXG4gICdlbmRwb2ludC5yZXNwb25zZSc6IHtoYXNBdHRyaWJ1dGVzOiBbJ3R5cGUnLCAnZGVzY3JpcHRpb24nXSB9LFxuICAnc3BlY2lmaWNhdGlvbnMnOiB7cHJlc2VuY2U6IHRydWV9LFxuICAnbGlua3MnOiB7YXJyYXk6IHRydWUsIGhhc0F0dHJpYnV0ZXM6IFsnbmFtZScsICd1cmwnXX0sXG59O1xuXG5cbmV4cG9ydCB7IHZhbGlkYXRvciwgQ0xJRU5UX1VSTF9UWVBFUyB9O1xuZXhwb3J0IGRlZmF1bHQgdmFsaWRhdG9yO1xuIl0sImZpbGUiOiJjb21tYW5kcy15bWwvdmFsaWRhdG9yLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uIn0=
