"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.inspectObject = inspectObject;
exports.parseCapsForInnerDriver = parseCapsForInnerDriver;
exports.insertAppiumPrefixes = insertAppiumPrefixes;
exports.getPackageVersion = getPackageVersion;
exports.pullSettings = pullSettings;
exports.removeAppiumPrefixes = removeAppiumPrefixes;
exports.rootDir = void 0;

require("source-map-support/register");

var _lodash = _interopRequireDefault(require("lodash"));

var _logger = _interopRequireDefault(require("./logger"));

var _appiumBaseDriver = require("appium-base-driver");

var _findRoot = _interopRequireDefault(require("find-root"));

const W3C_APPIUM_PREFIX = 'appium';

function inspectObject(args) {
  function getValueArray(obj, indent = '  ') {
    if (!_lodash.default.isObject(obj)) {
      return [obj];
    }

    let strArr = ['{'];

    for (let [arg, value] of _lodash.default.toPairs(obj)) {
      if (!_lodash.default.isObject(value)) {
        strArr.push(`${indent}  ${arg}: ${value}`);
      } else {
        value = getValueArray(value, `${indent}  `);
        strArr.push(`${indent}  ${arg}: ${value.shift()}`);
        strArr.push(...value);
      }
    }

    strArr.push(`${indent}}`);
    return strArr;
  }

  for (let [arg, value] of _lodash.default.toPairs(args)) {
    value = getValueArray(value);

    _logger.default.info(`  ${arg}: ${value.shift()}`);

    for (let val of value) {
      _logger.default.info(val);
    }
  }
}

function parseCapsForInnerDriver(jsonwpCapabilities, w3cCapabilities, constraints = {}, defaultCapabilities = {}) {
  const hasW3CCaps = _lodash.default.isPlainObject(w3cCapabilities) && (_lodash.default.has(w3cCapabilities, 'alwaysMatch') || _lodash.default.has(w3cCapabilities, 'firstMatch'));

  const hasJSONWPCaps = _lodash.default.isPlainObject(jsonwpCapabilities);

  let protocol = null;
  let desiredCaps = {};
  let processedW3CCapabilities = null;
  let processedJsonwpCapabilities = null;

  if (!hasJSONWPCaps && !hasW3CCaps) {
    return {
      protocol: _appiumBaseDriver.PROTOCOLS.W3C,
      error: new Error('Either JSONWP or W3C capabilities should be provided')
    };
  }

  const {
    W3C,
    MJSONWP
  } = _appiumBaseDriver.PROTOCOLS;
  jsonwpCapabilities = _lodash.default.cloneDeep(jsonwpCapabilities);
  w3cCapabilities = _lodash.default.cloneDeep(w3cCapabilities);
  defaultCapabilities = _lodash.default.cloneDeep(defaultCapabilities);

  if (!_lodash.default.isEmpty(defaultCapabilities)) {
    if (hasW3CCaps) {
      for (const [defaultCapKey, defaultCapValue] of _lodash.default.toPairs(defaultCapabilities)) {
        let isCapAlreadySet = false;

        for (const firstMatchEntry of w3cCapabilities.firstMatch || []) {
          if (_lodash.default.isPlainObject(firstMatchEntry) && _lodash.default.has(removeAppiumPrefixes(firstMatchEntry), removeAppiumPrefix(defaultCapKey))) {
            isCapAlreadySet = true;
            break;
          }
        }

        isCapAlreadySet = isCapAlreadySet || _lodash.default.isPlainObject(w3cCapabilities.alwaysMatch) && _lodash.default.has(removeAppiumPrefixes(w3cCapabilities.alwaysMatch), removeAppiumPrefix(defaultCapKey));

        if (isCapAlreadySet) {
          continue;
        }

        if (_lodash.default.isEmpty(w3cCapabilities.firstMatch)) {
          w3cCapabilities.firstMatch = [{
            [defaultCapKey]: defaultCapValue
          }];
        } else {
          w3cCapabilities.firstMatch[0][defaultCapKey] = defaultCapValue;
        }
      }
    }

    if (hasJSONWPCaps) {
      jsonwpCapabilities = Object.assign({}, removeAppiumPrefixes(defaultCapabilities), jsonwpCapabilities);
    }
  }

  if (hasJSONWPCaps) {
    protocol = MJSONWP;
    desiredCaps = jsonwpCapabilities;
    processedJsonwpCapabilities = { ...jsonwpCapabilities
    };
  }

  if (hasW3CCaps) {
    protocol = W3C;
    let isFixingNeededForW3cCaps = false;

    try {
      desiredCaps = (0, _appiumBaseDriver.processCapabilities)(w3cCapabilities, constraints, true);
    } catch (error) {
      if (!hasJSONWPCaps) {
        return {
          desiredCaps,
          processedJsonwpCapabilities,
          processedW3CCapabilities,
          protocol,
          error
        };
      }

      _logger.default.info(`Could not parse W3C capabilities: ${error.message}`);

      isFixingNeededForW3cCaps = true;
    }

    if (hasJSONWPCaps && !isFixingNeededForW3cCaps) {
      const differingKeys = _lodash.default.difference(_lodash.default.keys(removeAppiumPrefixes(processedJsonwpCapabilities)), _lodash.default.keys(removeAppiumPrefixes(desiredCaps)));

      if (!_lodash.default.isEmpty(differingKeys)) {
        _logger.default.info(`The following capabilities were provided in the JSONWP desired capabilities that are missing ` + `in W3C capabilities: ${JSON.stringify(differingKeys)}`);

        isFixingNeededForW3cCaps = true;
      }
    }

    if (isFixingNeededForW3cCaps && hasJSONWPCaps) {
      _logger.default.info('Trying to fix W3C capabilities by merging them with JSONWP caps');

      w3cCapabilities = fixW3cCapabilities(w3cCapabilities, jsonwpCapabilities);

      try {
        desiredCaps = (0, _appiumBaseDriver.processCapabilities)(w3cCapabilities, constraints, true);
      } catch (error) {
        _logger.default.warn(`Could not parse fixed W3C capabilities: ${error.message}. Falling back to JSONWP protocol`);

        return {
          desiredCaps: processedJsonwpCapabilities,
          processedJsonwpCapabilities,
          processedW3CCapabilities: null,
          protocol: MJSONWP
        };
      }
    }

    processedW3CCapabilities = {
      alwaysMatch: { ...insertAppiumPrefixes(desiredCaps)
      },
      firstMatch: [{}]
    };
  }

  return {
    desiredCaps,
    processedJsonwpCapabilities,
    processedW3CCapabilities,
    protocol
  };
}

function fixW3cCapabilities(w3cCaps, jsonwpCaps) {
  const result = {
    firstMatch: w3cCaps.firstMatch || [],
    alwaysMatch: w3cCaps.alwaysMatch || {}
  };

  const keysToInsert = _lodash.default.keys(jsonwpCaps);

  const removeMatchingKeys = match => {
    _lodash.default.pull(keysToInsert, match);

    const colonIndex = match.indexOf(':');

    if (colonIndex >= 0 && match.length > colonIndex) {
      _lodash.default.pull(keysToInsert, match.substring(colonIndex + 1));
    }

    if (keysToInsert.includes(`${W3C_APPIUM_PREFIX}:${match}`)) {
      _lodash.default.pull(keysToInsert, `${W3C_APPIUM_PREFIX}:${match}`);
    }
  };

  for (const firstMatchEntry of result.firstMatch) {
    for (const pair of _lodash.default.toPairs(firstMatchEntry)) {
      removeMatchingKeys(pair[0]);
    }
  }

  for (const pair of _lodash.default.toPairs(result.alwaysMatch)) {
    removeMatchingKeys(pair[0]);
  }

  for (const key of keysToInsert) {
    result.alwaysMatch[key] = jsonwpCaps[key];
  }

  return result;
}

function insertAppiumPrefixes(caps) {
  const STANDARD_CAPS = ['browserName', 'browserVersion', 'platformName', 'acceptInsecureCerts', 'pageLoadStrategy', 'proxy', 'setWindowRect', 'timeouts', 'unhandledPromptBehavior'];
  let prefixedCaps = {};

  for (let [name, value] of _lodash.default.toPairs(caps)) {
    if (STANDARD_CAPS.includes(name) || name.includes(':')) {
      prefixedCaps[name] = value;
    } else {
      prefixedCaps[`${W3C_APPIUM_PREFIX}:${name}`] = value;
    }
  }

  return prefixedCaps;
}

function removeAppiumPrefixes(caps) {
  if (!_lodash.default.isPlainObject(caps)) {
    return caps;
  }

  const fixedCaps = {};

  for (let [name, value] of _lodash.default.toPairs(caps)) {
    fixedCaps[removeAppiumPrefix(name)] = value;
  }

  return fixedCaps;
}

function removeAppiumPrefix(key) {
  const prefix = `${W3C_APPIUM_PREFIX}:`;
  return _lodash.default.startsWith(key, prefix) ? key.substring(prefix.length) : key;
}

function getPackageVersion(pkgName) {
  const pkgInfo = require(`${pkgName}/package.json`) || {};
  return pkgInfo.version;
}

function pullSettings(caps) {
  if (!_lodash.default.isPlainObject(caps) || _lodash.default.isEmpty(caps)) {
    return {};
  }

  const result = {};

  for (const [key, value] of _lodash.default.toPairs(caps)) {
    const match = /\bsettings\[(\S+)\]$/.exec(key);

    if (!match) {
      continue;
    }

    result[match[1]] = value;
    delete caps[key];
  }

  return result;
}

const rootDir = (0, _findRoot.default)(__dirname);
exports.rootDir = rootDir;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi91dGlscy5qcyJdLCJuYW1lcyI6WyJXM0NfQVBQSVVNX1BSRUZJWCIsImluc3BlY3RPYmplY3QiLCJhcmdzIiwiZ2V0VmFsdWVBcnJheSIsIm9iaiIsImluZGVudCIsIl8iLCJpc09iamVjdCIsInN0ckFyciIsImFyZyIsInZhbHVlIiwidG9QYWlycyIsInB1c2giLCJzaGlmdCIsImxvZ2dlciIsImluZm8iLCJ2YWwiLCJwYXJzZUNhcHNGb3JJbm5lckRyaXZlciIsImpzb253cENhcGFiaWxpdGllcyIsInczY0NhcGFiaWxpdGllcyIsImNvbnN0cmFpbnRzIiwiZGVmYXVsdENhcGFiaWxpdGllcyIsImhhc1czQ0NhcHMiLCJpc1BsYWluT2JqZWN0IiwiaGFzIiwiaGFzSlNPTldQQ2FwcyIsInByb3RvY29sIiwiZGVzaXJlZENhcHMiLCJwcm9jZXNzZWRXM0NDYXBhYmlsaXRpZXMiLCJwcm9jZXNzZWRKc29ud3BDYXBhYmlsaXRpZXMiLCJQUk9UT0NPTFMiLCJXM0MiLCJlcnJvciIsIkVycm9yIiwiTUpTT05XUCIsImNsb25lRGVlcCIsImlzRW1wdHkiLCJkZWZhdWx0Q2FwS2V5IiwiZGVmYXVsdENhcFZhbHVlIiwiaXNDYXBBbHJlYWR5U2V0IiwiZmlyc3RNYXRjaEVudHJ5IiwiZmlyc3RNYXRjaCIsInJlbW92ZUFwcGl1bVByZWZpeGVzIiwicmVtb3ZlQXBwaXVtUHJlZml4IiwiYWx3YXlzTWF0Y2giLCJPYmplY3QiLCJhc3NpZ24iLCJpc0ZpeGluZ05lZWRlZEZvclczY0NhcHMiLCJtZXNzYWdlIiwiZGlmZmVyaW5nS2V5cyIsImRpZmZlcmVuY2UiLCJrZXlzIiwiSlNPTiIsInN0cmluZ2lmeSIsImZpeFczY0NhcGFiaWxpdGllcyIsIndhcm4iLCJpbnNlcnRBcHBpdW1QcmVmaXhlcyIsInczY0NhcHMiLCJqc29ud3BDYXBzIiwicmVzdWx0Iiwia2V5c1RvSW5zZXJ0IiwicmVtb3ZlTWF0Y2hpbmdLZXlzIiwibWF0Y2giLCJwdWxsIiwiY29sb25JbmRleCIsImluZGV4T2YiLCJsZW5ndGgiLCJzdWJzdHJpbmciLCJpbmNsdWRlcyIsInBhaXIiLCJrZXkiLCJjYXBzIiwiU1RBTkRBUkRfQ0FQUyIsInByZWZpeGVkQ2FwcyIsIm5hbWUiLCJmaXhlZENhcHMiLCJwcmVmaXgiLCJzdGFydHNXaXRoIiwiZ2V0UGFja2FnZVZlcnNpb24iLCJwa2dOYW1lIiwicGtnSW5mbyIsInJlcXVpcmUiLCJ2ZXJzaW9uIiwicHVsbFNldHRpbmdzIiwiZXhlYyIsInJvb3REaXIiLCJfX2Rpcm5hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUEsTUFBTUEsaUJBQWlCLEdBQUcsUUFBMUI7O0FBRUEsU0FBU0MsYUFBVCxDQUF3QkMsSUFBeEIsRUFBOEI7QUFDNUIsV0FBU0MsYUFBVCxDQUF3QkMsR0FBeEIsRUFBNkJDLE1BQU0sR0FBRyxJQUF0QyxFQUE0QztBQUMxQyxRQUFJLENBQUNDLGdCQUFFQyxRQUFGLENBQVdILEdBQVgsQ0FBTCxFQUFzQjtBQUNwQixhQUFPLENBQUNBLEdBQUQsQ0FBUDtBQUNEOztBQUVELFFBQUlJLE1BQU0sR0FBRyxDQUFDLEdBQUQsQ0FBYjs7QUFDQSxTQUFLLElBQUksQ0FBQ0MsR0FBRCxFQUFNQyxLQUFOLENBQVQsSUFBeUJKLGdCQUFFSyxPQUFGLENBQVVQLEdBQVYsQ0FBekIsRUFBeUM7QUFDdkMsVUFBSSxDQUFDRSxnQkFBRUMsUUFBRixDQUFXRyxLQUFYLENBQUwsRUFBd0I7QUFDdEJGLFFBQUFBLE1BQU0sQ0FBQ0ksSUFBUCxDQUFhLEdBQUVQLE1BQU8sS0FBSUksR0FBSSxLQUFJQyxLQUFNLEVBQXhDO0FBQ0QsT0FGRCxNQUVPO0FBQ0xBLFFBQUFBLEtBQUssR0FBR1AsYUFBYSxDQUFDTyxLQUFELEVBQVMsR0FBRUwsTUFBTyxJQUFsQixDQUFyQjtBQUNBRyxRQUFBQSxNQUFNLENBQUNJLElBQVAsQ0FBYSxHQUFFUCxNQUFPLEtBQUlJLEdBQUksS0FBSUMsS0FBSyxD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akUsZ0JBQUU4QixPQUFGLENBQVVtQyxJQUFWLENBQTlCLEVBQStDO0FBQzdDLFdBQU8sRUFBUDtBQUNEOztBQUVELFFBQU1aLE1BQU0sR0FBRyxFQUFmOztBQUNBLE9BQUssTUFBTSxDQUFDVyxHQUFELEVBQU01RCxLQUFOLENBQVgsSUFBMkJKLGdCQUFFSyxPQUFGLENBQVU0RCxJQUFWLENBQTNCLEVBQTRDO0FBQzFDLFVBQU1ULEtBQUssR0FBRyx1QkFBdUJzQixJQUF2QixDQUE0QmQsR0FBNUIsQ0FBZDs7QUFDQSxRQUFJLENBQUNSLEtBQUwsRUFBWTtBQUNWO0FBQ0Q7O0FBRURILElBQUFBLE1BQU0sQ0FBQ0csS0FBSyxDQUFDLENBQUQsQ0FBTixDQUFOLEdBQW1CcEQsS0FBbkI7QUFDQSxXQUFPNkQsSUFBSSxDQUFDRCxHQUFELENBQVg7QUFDRDs7QUFDRCxTQUFPWCxNQUFQO0FBQ0Q7O0FBRUQsTUFBTTBCLE9BQU8sR0FBRyx1QkFBU0MsU0FBVCxDQUFoQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgbG9nZ2VyIGZyb20gJy4vbG9nZ2VyJztcbmltcG9ydCB7IHByb2Nlc3NDYXBhYmlsaXRpZXMsIFBST1RPQ09MUyB9IGZyb20gJ2FwcGl1bS1iYXNlLWRyaXZlcic7XG5pbXBvcnQgZmluZFJvb3QgZnJvbSAnZmluZC1yb290JztcblxuY29uc3QgVzNDX0FQUElVTV9QUkVGSVggPSAnYXBwaXVtJztcblxuZnVuY3Rpb24gaW5zcGVjdE9iamVjdCAoYXJncykge1xuICBmdW5jdGlvbiBnZXRWYWx1ZUFycmF5IChvYmosIGluZGVudCA9ICcgICcpIHtcbiAgICBpZiAoIV8uaXNPYmplY3Qob2JqKSkge1xuICAgICAgcmV0dXJuIFtvYmpdO1xuICAgIH1cblxuICAgIGxldCBzdHJBcnIgPSBbJ3snXTtcbiAgICBmb3IgKGxldCBbYXJnLCB2YWx1ZV0gb2YgXy50b1BhaXJzKG9iaikpIHtcbiAgICAgIGlmICghXy5pc09iamVjdCh2YWx1ZSkpIHtcbiAgICAgICAgc3RyQXJyLnB1c2goYCR7aW5kZW50fSAgJHthcmd9OiAke3ZhbHVlfWApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSBnZXRWYWx1ZUFycmF5KHZhbHVlLCBgJHtpbmRlbnR9ICBgKTtcbiAgICAgICAgc3RyQXJyLnB1c2goYCR7aW5kZW50fSAgJHthcmd9OiAke3ZhbHVlLnNoaWZ0KCl9YCk7XG4gICAgICAgIHN0ckFyci5wdXNoKC4uLnZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgc3RyQXJyLnB1c2goYCR7aW5kZW50fX1gKTtcbiAgICByZXR1cm4gc3RyQXJyO1xuICB9XG4gIGZvciAobGV0IFthcmcsIHZhbHVlXSBvZiBfLnRvUGFpcnMoYXJncykpIHtcbiAgICB2YWx1ZSA9IGdldFZhbHVlQXJyYXkodmFsdWUpO1xuICAgIGxvZ2dlci5pbmZvKGAgICR7YXJnfTogJHt2YWx1ZS5zaGlmdCgpfWApO1xuICAgIGZvciAobGV0IHZhbCBvZiB2YWx1ZSkge1xuICAgICAgbG9nZ2VyLmluZm8odmFsKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBUYWtlcyB0aGUgY2FwcyB0aGF0IHdlcmUgcHJvdmlkZWQgaW4gdGhlIHJlcXVlc3QgYW5kIHRyYW5zbGF0ZXMgdGhlbVxuICogaW50byBjYXBzIHRoYXQgY2FuIGJlIHVzZWQgYnkgdGhlIGlubmVyIGRyaXZlcnMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGpzb253cENhcGFiaWxpdGllc1xuICogQHBhcmFtIHtPYmplY3R9IHczY0NhcGFiaWxpdGllc1xuICogQHBhcmFtIHtPYmplY3R9IGNvbnN0cmFpbnRzXG4gKiBAcGFyYW0ge09iamVjdH0gZGVmYXVsdENhcGFiaWxpdGllc1xuICovXG5mdW5jdGlvbiBwYXJzZUNhcHNGb3JJbm5lckRyaXZlciAoanNvbndwQ2FwYWJpbGl0aWVzLCB3M2NDYXBhYmlsaXRpZXMsIGNvbnN0cmFpbnRzID0ge30sIGRlZmF1bHRDYXBhYmlsaXRpZXMgPSB7fSkge1xuICAvLyBDaGVjayBpZiB0aGUgY2FsbGVyIHNlbnQgSlNPTldQIGNhcHMsIFczQyBjYXBzLCBvciBib3RoXG4gIGNvbnN0IGhhc1czQ0NhcHMgPSBfLmlzUGxhaW5PYmplY3QodzNjQ2FwYWJpbGl0aWVzKSAmJlxuICAgIChfLmhhcyh3M2NDYXBhYmlsaXRpZXMsICdhbHdheXNNYXRjaCcpIHx8IF8uaGFzKHczY0NhcGFiaWxpdGllcywgJ2ZpcnN0TWF0Y2gnKSk7XG4gIGNvbnN0IGhhc0pTT05XUENhcHMgPSBfLmlzUGxhaW5PYmplY3QoanNvbndwQ2FwYWJpbGl0aWVzKTtcbiAgbGV0IHByb3RvY29sID0gbnVsbDtcbiAgbGV0IGRlc2lyZWRDYXBzID0ge307XG4gIGxldCBwcm9jZXNzZWRXM0NDYXBhYmlsaXRpZXMgPSBudWxsO1xuICBsZXQgcHJvY2Vzc2VkSnNvbndwQ2FwYWJpbGl0aWVzID0gbnVsbDtcblxuICBpZiAoIWhhc0pTT05XUENhcHMgJiYgIWhhc1czQ0NhcHMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcHJvdG9jb2w6IFBST1RPQ09MUy5XM0MsXG4gICAgICBlcnJvcjogbmV3IEVycm9yKCdFaXRoZXIgSlNPTldQIG9yIFczQyBjYXBhYmlsaXRpZXMgc2hvdWxkIGJlIHByb3ZpZGVkJyksXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IHtXM0MsIE1KU09OV1B9ID0gUFJPVE9DT0xTO1xuXG4gIC8vIE1ha2Ugc3VyZSB3ZSBkb24ndCBtdXRhdGUgdGhlIG9yaWdpbmFsIGFyZ3VtZW50c1xuICBqc29ud3BDYXBhYmlsaXRpZXMgPSBfLmNsb25lRGVlcChqc29ud3BDYXBhYmlsaXRpZXMpO1xuICB3M2NDYXBhYmlsaXRpZXMgPSBfLmNsb25lRGVlcCh3M2NDYXBhYmlsaXRpZXMpO1xuICBkZWZhdWx0Q2FwYWJpbGl0aWVzID0gXy5jbG9uZURlZXAoZGVmYXVsdENhcGFiaWxpdGllcyk7XG5cbiAgaWYgKCFfLmlzRW1wdHkoZGVmYXVsdENhcGFiaWxpdGllcykpIHtcbiAgICBpZiAoaGFzVzNDQ2Fwcykge1xuICAgICAgZm9yIChjb25zdCBbZGVmYXVsdENhcEtleSwgZGVmYXVsdENhcFZhbHVlXSBvZiBfLnRvUGFpcnMoZGVmYXVsdENhcGFiaWxpdGllcykpIHtcbiAgICAgICAgbGV0IGlzQ2FwQWxyZWFkeVNldCA9IGZhbHNlO1xuICAgICAgICAvLyBDaGVjayBpZiB0aGUga2V5IGlzIGFscmVhZHkgcHJlc2VudCBpbiBmaXJzdE1hdGNoIGVudHJpZXNcbiAgICAgICAgZm9yIChjb25zdCBmaXJzdE1hdGNoRW50cnkgb2YgKHczY0NhcGFiaWxpdGllcy5maXJzdE1hdGNoIHx8IFtdKSkge1xuICAgICAgICAgIGlmIChfLmlzUGxhaW5PYmplY3QoZmlyc3RNYXRjaEVudHJ5KVxuICAgICAgICAgICAgICAmJiBfLmhhcyhyZW1vdmVBcHBpdW1QcmVmaXhlcyhmaXJzdE1hdGNoRW50cnkpLCByZW1vdmVBcHBpdW1QcmVmaXgoZGVmYXVsdENhcEtleSkpKSB7XG4gICAgICAgICAgICBpc0NhcEFscmVhZHlTZXQgPSB0cnVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIENoZWNrIGlmIHRoZSBrZXkgaXMgYWxyZWFkeSBwcmVzZW50IGluIGFsd2F5c01hdGNoIGVudHJpZXNcbiAgICAgICAgaXNDYXBBbHJlYWR5U2V0ID0gaXNDYXBBbHJlYWR5U2V0IHx8IChfLmlzUGxhaW5PYmplY3QodzNjQ2FwYWJpbGl0aWVzLmFsd2F5c01hdGNoKVxuICAgICAgICAgICYmIF8uaGFzKHJlbW92ZUFwcGl1bVByZWZpeGVzKHczY0NhcGFiaWxpdGllcy5hbHdheXNNYXRjaCksIHJlbW92ZUFwcGl1bVByZWZpeChkZWZhdWx0Q2FwS2V5KSkpO1xuICAgICAgICBpZiAoaXNDYXBBbHJlYWR5U2V0KSB7XG4gICAgICAgICAgLy8gU2tpcCBpZiB0aGUga2V5IGlzIGFscmVhZHkgcHJlc2VudCBpbiB0aGUgcHJvdmlkZWQgY2Fwc1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gT25seSBhZGQgdGhlIGRlZmF1bHQgY2FwYWJpbGl0eSBpZiBpdCBpcyBub3Qgb3ZlcnJpZGRlblxuICAgICAgICBpZiAoXy5pc0VtcHR5KHczY0NhcGFiaWxpdGllcy5maXJzdE1hdGNoKSkge1xuICAgICAgICAgIHczY0NhcGFiaWxpdGllcy5maXJzdE1hdGNoID0gW3tbZGVmYXVsdENhcEtleV06IGRlZmF1bHRDYXBWYWx1ZX1dO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHczY0NhcGFiaWxpdGllcy5maXJzdE1hdGNoWzBdW2RlZmF1bHRDYXBLZXldID0gZGVmYXVsdENhcFZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChoYXNKU09OV1BDYXBzKSB7XG4gICAgICBqc29ud3BDYXBhYmlsaXRpZXMgPSBPYmplY3QuYXNzaWduKHt9LCByZW1vdmVBcHBpdW1QcmVmaXhlcyhkZWZhdWx0Q2FwYWJpbGl0aWVzKSwganNvbndwQ2FwYWJpbGl0aWVzKTtcbiAgICB9XG4gIH1cblxuICAvLyBHZXQgTUpTT05XUCBjYXBzXG4gIGlmIChoYXNKU09OV1BDYXBzKSB7XG4gICAgcHJvdG9jb2wgPSBNSlNPTldQO1xuICAgIGRlc2lyZWRDYXBzID0ganNvbndwQ2FwYWJpbGl0aWVzO1xuICAgIHByb2Nlc3NlZEpzb253cENhcGFiaWxpdGllcyA9IHsuLi5qc29ud3BDYXBhYmlsaXRpZXN9O1xuICB9XG5cbiAgLy8gR2V0IFczQyBjYXBzXG4gIGlmIChoYXNXM0NDYXBzKSB7XG4gICAgcHJvdG9jb2wgPSBXM0M7XG4gICAgLy8gQ2FsbCB0aGUgcHJvY2VzcyBjYXBhYmlsaXRpZXMgYWxnb3JpdGhtIHRvIGZpbmQgbWF0Y2hpbmcgY2FwcyBvbiB0aGUgVzNDXG4gICAgLy8gKHNlZTogaHR0cHM6Ly9naXRodWIuY29tL2psaXBwcy9zaW1wbGUtd2Qtc3BlYyNwcm9jZXNzaW5nLWNhcGFiaWxpdGllcylcbiAgICBsZXQgaXNGaXhpbmdOZWVkZWRGb3JXM2NDYXBzID0gZmFsc2U7XG4gICAgdHJ5IHtcbiAgICAgIGRlc2lyZWRDYXBzID0gcHJvY2Vzc0NhcGFiaWxpdGllcyh3M2NDYXBhYmlsaXRpZXMsIGNvbnN0cmFpbnRzLCB0cnVlKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKCFoYXNKU09OV1BDYXBzKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZGVzaXJlZENhcHMsXG4gICAgICAgICAgcHJvY2Vzc2VkSnNvbndwQ2FwYWJpbGl0aWVzLFxuICAgICAgICAgIHByb2Nlc3NlZFczQ0NhcGFiaWxpdGllcyxcbiAgICAgICAgICBwcm90b2NvbCxcbiAgICAgICAgICBlcnJvcixcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGxvZ2dlci5pbmZvKGBDb3VsZCBub3QgcGFyc2UgVzNDIGNhcGFiaWxpdGllczogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgaXNGaXhpbmdOZWVkZWRGb3JXM2NDYXBzID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoaGFzSlNPTldQQ2FwcyAmJiAhaXNGaXhpbmdOZWVkZWRGb3JXM2NDYXBzKSB7XG4gICAgICBjb25zdCBkaWZmZXJpbmdLZXlzID0gXy5kaWZmZXJlbmNlKF8ua2V5cyhyZW1vdmVBcHBpdW1QcmVmaXhlcyhwcm9jZXNzZWRKc29ud3BDYXBhYmlsaXRpZXMpKSwgXy5rZXlzKHJlbW92ZUFwcGl1bVByZWZpeGVzKGRlc2lyZWRDYXBzKSkpO1xuICAgICAgaWYgKCFfLmlzRW1wdHkoZGlmZmVyaW5nS2V5cykpIHtcbiAgICAgICAgbG9nZ2VyLmluZm8oYFRoZSBmb2xsb3dpbmcgY2FwYWJpbGl0aWVzIHdlcmUgcHJvdmlkZWQgaW4gdGhlIEpTT05XUCBkZXNpcmVkIGNhcGFiaWxpdGllcyB0aGF0IGFyZSBtaXNzaW5nIGAgK1xuICAgICAgICAgIGBpbiBXM0MgY2FwYWJpbGl0aWVzOiAke0pTT04uc3RyaW5naWZ5KGRpZmZlcmluZ0tleXMpfWApO1xuICAgICAgICBpc0ZpeGluZ05lZWRlZEZvclczY0NhcHMgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpc0ZpeGluZ05lZWRlZEZvclczY0NhcHMgJiYgaGFzSlNPTldQQ2Fwcykge1xuICAgICAgbG9nZ2VyLmluZm8oJ1RyeWluZyB0byBmaXggVzNDIGNhcGFiaWxpdGllcyBieSBtZXJnaW5nIHRoZW0gd2l0aCBKU09OV1AgY2FwcycpO1xuICAgICAgdzNjQ2FwYWJpbGl0aWVzID0gZml4VzNjQ2FwYWJpbGl0aWVzKHczY0NhcGFiaWxpdGllcywganNvbndwQ2FwYWJpbGl0aWVzKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGRlc2lyZWRDYXBzID0gcHJvY2Vzc0NhcGFiaWxpdGllcyh3M2NDYXBhYmlsaXRpZXMsIGNvbnN0cmFpbnRzLCB0cnVlKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGxvZ2dlci53YXJuKGBDb3VsZCBub3QgcGFyc2UgZml4ZWQgVzNDIGNhcGFiaWxpdGllczogJHtlcnJvci5tZXNzYWdlfS4gRmFsbGluZyBiYWNrIHRvIEpTT05XUCBwcm90b2NvbGApO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGRlc2lyZWRDYXBzOiBwcm9jZXNzZWRKc29ud3BDYXBhYmlsaXRpZXMsXG4gICAgICAgICAgcHJvY2Vzc2VkSnNvbndwQ2FwYWJpbGl0aWVzLFxuICAgICAgICAgIHByb2Nlc3NlZFczQ0NhcGFiaWxpdGllczogbnVsbCxcbiAgICAgICAgICBwcm90b2NvbDogTUpTT05XUCxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgYSBuZXcgdzNjIGNhcGFiaWxpdGllcyBwYXlsb2FkIHRoYXQgY29udGFpbnMgb25seSB0aGUgbWF0Y2hpbmcgY2FwcyBpbiBgYWx3YXlzTWF0Y2hgXG4gICAgcHJvY2Vzc2VkVzNDQ2FwYWJpbGl0aWVzID0ge1xuICAgICAgYWx3YXlzTWF0Y2g6IHsuLi5pbnNlcnRBcHBpdW1QcmVmaXhlcyhkZXNpcmVkQ2Fwcyl9LFxuICAgICAgZmlyc3RNYXRjaDogW3t9XSxcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHtkZXNpcmVkQ2FwcywgcHJvY2Vzc2VkSnNvbndwQ2FwYWJpbGl0aWVzLCBwcm9jZXNzZWRXM0NDYXBhYmlsaXRpZXMsIHByb3RvY29sfTtcbn1cblxuLyoqXG4gKiBUaGlzIGhlbHBlciBtZXRob2QgdHJpZXMgdG8gZml4IGNvcnJ1cHRlZCBXM0MgY2FwYWJpbGl0aWVzIGJ5XG4gKiBtZXJnaW5nIHRoZW0gdG8gZXhpc3RpbmcgSlNPTldQIGNhcGFiaWxpdGllcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdzNjQ2FwcyBXM0MgY2FwYWJpbGl0aWVzXG4gKiBAcGFyYW0ge09iamVjdH0ganNvbndwQ2FwcyBKU09OV1AgY2FwYWJpbGl0aWVzXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBGaXhlZCBXM0MgY2FwYWJpbGl0aWVzXG4gKi9cbmZ1bmN0aW9uIGZpeFczY0NhcGFiaWxpdGllcyAodzNjQ2FwcywganNvbndwQ2Fwcykge1xuICBjb25zdCByZXN1bHQgPSB7XG4gICAgZmlyc3RNYXRjaDogdzNjQ2Fwcy5maXJzdE1hdGNoIHx8IFtdLFxuICAgIGFsd2F5c01hdGNoOiB3M2NDYXBzLmFsd2F5c01hdGNoIHx8IHt9LFxuICB9O1xuICBjb25zdCBrZXlzVG9JbnNlcnQgPSBfLmtleXMoanNvbndwQ2Fwcyk7XG4gIGNvbnN0IHJlbW92ZU1hdGNoaW5nS2V5cyA9IChtYXRjaCkgPT4ge1xuICAgIF8ucHVsbChrZXlzVG9JbnNlcnQsIG1hdGNoKTtcbiAgICBjb25zdCBjb2xvbkluZGV4ID0gbWF0Y2guaW5kZXhPZignOicpO1xuICAgIGlmIChjb2xvbkluZGV4ID49IDAgJiYgbWF0Y2gubGVuZ3RoID4gY29sb25JbmRleCkge1xuICAgICAgXy5wdWxsKGtleXNUb0luc2VydCwgbWF0Y2guc3Vic3RyaW5nKGNvbG9uSW5kZXggKyAxKSk7XG4gICAgfVxuICAgIGlmIChrZXlzVG9JbnNlcnQuaW5jbHVkZXMoYCR7VzNDX0FQUElVTV9QUkVGSVh9OiR7bWF0Y2h9YCkpIHtcbiAgICAgIF8ucHVsbChrZXlzVG9JbnNlcnQsIGAke1czQ19BUFBJVU1fUFJFRklYfToke21hdGNofWApO1xuICAgIH1cbiAgfTtcblxuICBmb3IgKGNvbnN0IGZpcnN0TWF0Y2hFbnRyeSBvZiByZXN1bHQuZmlyc3RNYXRjaCkge1xuICAgIGZvciAoY29uc3QgcGFpciBvZiBfLnRvUGFpcnMoZmlyc3RNYXRjaEVudHJ5KSkge1xuICAgICAgcmVtb3ZlTWF0Y2hpbmdLZXlzKHBhaXJbMF0pO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoY29uc3QgcGFpciBvZiBfLnRvUGFpcnMocmVzdWx0LmFsd2F5c01hdGNoKSkge1xuICAgIHJlbW92ZU1hdGNoaW5nS2V5cyhwYWlyWzBdKTtcbiAgfVxuXG4gIGZvciAoY29uc3Qga2V5IG9mIGtleXNUb0luc2VydCkge1xuICAgIHJlc3VsdC5hbHdheXNNYXRjaFtrZXldID0ganNvbndwQ2Fwc1trZXldO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogVGFrZXMgYSBjYXBhYmlsaXRpZXMgb2JqZWN0cyBhbmQgcHJlZml4ZXMgY2FwYWJpbGl0aWVzIHdpdGggYGFwcGl1bTpgXG4gKiBAcGFyYW0ge09iamVjdH0gY2FwcyBEZXNpcmVkIGNhcGFiaWxpdGllcyBvYmplY3RcbiAqL1xuZnVuY3Rpb24gaW5zZXJ0QXBwaXVtUHJlZml4ZXMgKGNhcHMpIHtcbiAgLy8gU3RhbmRhcmQsIG5vbi1wcmVmaXhlZCBjYXBhYmlsaXRpZXMgKHNlZSBodHRwczovL3d3dy53My5vcmcvVFIvd2ViZHJpdmVyLyNkZm4tdGFibGUtb2Ytc3RhbmRhcmQtY2FwYWJpbGl0aWVzKVxuICBjb25zdCBTVEFOREFSRF9DQVBTID0gW1xuICAgICdicm93c2VyTmFtZScsXG4gICAgJ2Jyb3dzZXJWZXJzaW9uJyxcbiAgICAncGxhdGZvcm1OYW1lJyxcbiAgICAnYWNjZXB0SW5zZWN1cmVDZXJ0cycsXG4gICAgJ3BhZ2VMb2FkU3RyYXRlZ3knLFxuICAgICdwcm94eScsXG4gICAgJ3NldFdpbmRvd1JlY3QnLFxuICAgICd0aW1lb3V0cycsXG4gICAgJ3VuaGFuZGxlZFByb21wdEJlaGF2aW9yJ1xuICBdO1xuXG4gIGxldCBwcmVmaXhlZENhcHMgPSB7fTtcbiAgZm9yIChsZXQgW25hbWUsIHZhbHVlXSBvZiBfLnRvUGFpcnMoY2FwcykpIHtcbiAgICBpZiAoU1RBTkRBUkRfQ0FQUy5pbmNsdWRlcyhuYW1lKSB8fCBuYW1lLmluY2x1ZGVzKCc6JykpIHtcbiAgICAgIHByZWZpeGVkQ2Fwc1tuYW1lXSA9IHZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBwcmVmaXhlZENhcHNbYCR7VzNDX0FQUElVTV9QUkVGSVh9OiR7bmFtZX1gXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcHJlZml4ZWRDYXBzO1xufVxuXG5mdW5jdGlvbiByZW1vdmVBcHBpdW1QcmVmaXhlcyAoY2Fwcykge1xuICBpZiAoIV8uaXNQbGFpbk9iamVjdChjYXBzKSkge1xuICAgIHJldHVybiBjYXBzO1xuICB9XG5cbiAgY29uc3QgZml4ZWRDYXBzID0ge307XG4gIGZvciAobGV0IFtuYW1lLCB2YWx1ZV0gb2YgXy50b1BhaXJzKGNhcHMpKSB7XG4gICAgZml4ZWRDYXBzW3JlbW92ZUFwcGl1bVByZWZpeChuYW1lKV0gPSB2YWx1ZTtcbiAgfVxuICByZXR1cm4gZml4ZWRDYXBzO1xufVxuXG5mdW5jdGlvbiByZW1vdmVBcHBpdW1QcmVmaXggKGtleSkge1xuICBjb25zdCBwcmVmaXggPSBgJHtXM0NfQVBQSVVNX1BSRUZJWH06YDtcbiAgcmV0dXJuIF8uc3RhcnRzV2l0aChrZXksIHByZWZpeCkgPyBrZXkuc3Vic3RyaW5nKHByZWZpeC5sZW5ndGgpIDoga2V5O1xufVxuXG5mdW5jdGlvbiBnZXRQYWNrYWdlVmVyc2lvbiAocGtnTmFtZSkge1xuICBjb25zdCBwa2dJbmZvID0gcmVxdWlyZShgJHtwa2dOYW1lfS9wYWNrYWdlLmpzb25gKSB8fCB7fTtcbiAgcmV0dXJuIHBrZ0luZm8udmVyc2lvbjtcbn1cblxuLyoqXG4gKiBQdWxscyB0aGUgaW5pdGlhbCB2YWx1ZXMgb2YgQXBwaXVtIHNldHRpbmdzIGZyb20gdGhlIGdpdmVuIGNhcGFiaWxpdGllcyBhcmd1bWVudC5cbiAqIEVhY2ggc2V0dGluZyBpdGVtIG11c3Qgc2F0aXNmeSB0aGUgZm9sbG93aW5nIGZvcm1hdDpcbiAqIGBzZXR0aW5nW3NldHRpbmdfbmFtZV06IHNldHRpbmdfdmFsdWVgXG4gKiBUaGUgY2FwYWJpbGl0aWVzIGFyZ3VtZW50IGl0c2VsZiBnZXRzIG11dGF0ZWQsIHNvIGl0IGRvZXMgbm90IGNvbnRhaW4gcGFyc2VkXG4gKiBzZXR0aW5ncyBhbnltb3JlIHRvIGF2b2lkIGZ1cnRoZXIgcGFyc2luZyBpc3N1ZXMuXG4gKiBDaGVja1xuICogaHR0cHM6Ly9naXRodWIuY29tL2FwcGl1bS9hcHBpdW0vYmxvYi9tYXN0ZXIvZG9jcy9lbi9hZHZhbmNlZC1jb25jZXB0cy9zZXR0aW5ncy5tZFxuICogZm9yIG1vcmUgZGV0YWlscyBvbiB0aGUgYXZhaWxhYmxlIHNldHRpbmdzLlxuICpcbiAqIEBwYXJhbSB7P09iamVjdH0gY2FwcyAtIENhcGFiaWxpdGllcyBkaWN0aW9uYXJ5LiBJdCBpcyBtdXRhdGVkIGlmXG4gKiBvbmUgb3IgbW9yZSBzZXR0aW5ncyBoYXZlIGJlZW4gcHVsbGVkIGZyb20gaXRcbiAqIEByZXR1cm5zIHtPYmplY3R9IC0gQW4gZW1wdHkgZGljdGlvbmFyeSBpZiB0aGUgZ2l2ZW4gY2FwcyBjb250YWlucyBub1xuICogc2V0dGluZyBpdGVtcyBvciBhIGRpY3Rpb25hcnkgY29udGFpbmluZyBwYXJzZWQgQXBwaXVtIHNldHRpbmcgbmFtZXMgYWxvbmcgd2l0aFxuICogdGhlaXIgdmFsdWVzLlxuICovXG5mdW5jdGlvbiBwdWxsU2V0dGluZ3MgKGNhcHMpIHtcbiAgaWYgKCFfLmlzUGxhaW5PYmplY3QoY2FwcykgfHwgXy5pc0VtcHR5KGNhcHMpKSB7XG4gICAgcmV0dXJuIHt9O1xuICB9XG5cbiAgY29uc3QgcmVzdWx0ID0ge307XG4gIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIF8udG9QYWlycyhjYXBzKSkge1xuICAgIGNvbnN0IG1hdGNoID0gL1xcYnNldHRpbmdzXFxbKFxcUyspXFxdJC8uZXhlYyhrZXkpO1xuICAgIGlmICghbWF0Y2gpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHJlc3VsdFttYXRjaFsxXV0gPSB2YWx1ZTtcbiAgICBkZWxldGUgY2Fwc1trZXldO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmNvbnN0IHJvb3REaXIgPSBmaW5kUm9vdChfX2Rpcm5hbWUpO1xuXG5leHBvcnQge1xuICBpbnNwZWN0T2JqZWN0LCBwYXJzZUNhcHNGb3JJbm5lckRyaXZlciwgaW5zZXJ0QXBwaXVtUHJlZml4ZXMsIHJvb3REaXIsXG4gIGdldFBhY2thZ2VWZXJzaW9uLCBwdWxsU2V0dGluZ3MsIHJlbW92ZUFwcGl1bVByZWZpeGVzLFxufTtcbiJdLCJmaWxlIjoibGliL3V0aWxzLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uIn0=
