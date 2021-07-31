"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

require("source-map-support/register");

var _lodash = _interopRequireDefault(require("lodash"));

var _chai = _interopRequireDefault(require("chai"));

var _sinon = _interopRequireDefault(require("sinon"));

var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));

var _config = require("../lib/config");

var _parser = _interopRequireDefault(require("../lib/parser"));

var _logger = _interopRequireDefault(require("../lib/logger"));

var _appiumSupport = require("appium-support");

var _axios = _interopRequireDefault(require("axios"));

let should = _chai.default.should();

_chai.default.use(_chaiAsPromised.default);

describe('Config', function () {
  describe('getGitRev', function () {
    it('should get a reasonable git revision', async function () {
      let rev = await (0, _config.getGitRev)();
      rev.should.be.a('string');
      rev.length.should.be.equal(40);
      rev.match(/[0-9a-f]+/i)[0].should.eql(rev);
    });
  });
  describe('Appium config', function () {
    describe('getBuildInfo', function () {
      async function verifyBuildInfoUpdate(useLocalGit) {
        const buildInfo = (0, _config.getBuildInfo)();
        mockFs.expects('exists').atLeast(1).returns(useLocalGit);
        buildInfo['git-sha'] = undefined;
        buildInfo.built = undefined;
        await (0, _config.updateBuildInfo)(true);
        buildInfo.should.be.an('object');
        should.exist(buildInfo['git-sha']);
        should.exist(buildInfo.built);
        should.exist(buildInfo.version);
      }

      let mockFs;
      let getStub;
      beforeEach(function () {
        mockFs = _sinon.default.mock(_appiumSupport.fs);
        getStub = _sinon.default.stub(_axios.default, 'get');
      });
      afterEach(function () {
        getStub.restore();
        mockFs.restore();
      });
      it('should get a configuration object if the local git metadata is present', async function () {
        await verifyBuildInfoUpdate(true);
      });
      it('should get a configuration object if the local git metadata is not present', async function () {
        getStub.onCall(0).returns({
          data: [{
            'name': `v${_config.APPIUM_VER}`,
            'zipball_url': 'https://api.github.com/repos/appium/appium/zipball/v1.9.0-beta.1',
            'tarball_url': 'https://api.github.com/repos/appium/appium/tarball/v1.9.0-beta.1',
            'commit': {
              'sha': '3c2752f9f9c56000705a4ae15b3ba68a5d2e644c',
              'url': 'https://api.github.com/repos/appium/appium/commits/3c2752f9f9c56000705a4ae15b3ba68a5d2e644c'
            },
            'node_id': 'MDM6UmVmNzUzMDU3MDp2MS45LjAtYmV0YS4x'
          }, {
            'name': 'v1.8.2-beta',
            'zipball_url': 'https://api.github.com/repos/appium/appium/zipball/v1.8.2-beta',
            'tarball_url': 'https://api.github.com/repos/appium/appium/tarball/v1.8.2-beta',
            'commit': {
              'sha': '5b98b9197e75aa85e7507d21d3126c1a63d1ce8f',
              'url': 'https://api.github.com/repos/appium/appium/commits/5b98b9197e75aa85e7507d21d3126c1a63d1ce8f'
            },
            'node_id': 'MDM6UmVmNzUzMDU3MDp2MS44LjItYmV0YQ=='
          }]
        });
        getStub.onCall(1).returns({
          data: {
            'sha': '3c2752f9f9c56000705a4ae15b3ba68a5d2e644c',
            'node_id': 'MDY6Q29tbWl0NzUzMDU3MDozYzI3NTJmOWY5YzU2MDAwNzA1YTRhZTE1YjNiYTY4YTVkMmU2NDRj',
            'commit': {
              'author': {
                'name': 'Isaac Murchie',
                'email': 'isaac@saucelabs.com',
                'date': '2018-08-17T19:48:00Z'
              },
              'committer': {
                'name': 'Isaac Murchie',
                'email': 'isaac@saucelabs.com',
                'date': '2018-08-17T19:48:00Z'
              },
              'message': 'v1.9.0-beta.1',
              'tree': {
                'sha': '2c0974727470eba419ea0b9951c52f72f8036b18',
                'url': 'https://api.github.com/repos/appium/appium/git/trees/2c0974727470eba419ea0b9951c52f72f8036b18'
              },
              'url': 'https://api.github.com/repos/appium/appium/git/commits/3c2752f9f9c56000705a4ae15b3ba68a5d2e644c',
              'comment_count': 0,
              'verification': {
                'verified': false,
                'reason': 'unsigned',
                'signature': null,
                'payload': null
              }
            },
            'url': 'https://api.github.com/repos/appium/appium/commits/3c2752f9f9c56000705a4ae15b3ba68a5d2e644c',
            'html_url': 'https://github.com/appium/appium/commit/3c2752f9f9c56000705a4ae15b3ba68a5d2e644c',
            'comments_url': 'https://api.github.com/repos/appium/appium/commits/3c2752f9f9c56000705a4ae15b3ba68a5d2e644c/comments'
          }
        });
        await verifyBuildInfoUpdate(false);
      });
    });
    describe('showConfig', function () {
      before(function () {
        _sinon.default.spy(console, 'log');
      });
      it('should log the config to console', async function () {
        const config = (0, _config.getBuildInfo)();
        await (0, _config.showConfig)();
        console.log.calledOnce.should.be.true;
        console.log.getCall(0).args[0].should.contain(JSON.stringify(config));
      });
    });
  });
  describe('node.js config', function () {
    let _process = process;
    before(function () {
      let tempProcess = {};

      for (let [prop, value] of _lodash.default.toPairs(process)) {
        tempProcess[prop] = value;
      }

      process = tempProcess;
    });
    after(function () {
      process = _process;
    });
    describe('checkNodeOk', function () {
      describe('unsupported nodes', function () {
        const unsupportedVersions = ['v0.1', 'v0.9.12', 'v0.10.36', 'v0.12.14', 'v4.4.7', 'v5.7.0', 'v6.3.1', 'v7.1.1', 'v8.1.2', 'v9.1.2', 'v10.0.1', 'v11.6.0'];

        for (const version of unsupportedVersions) {
          it(`should fail if node is ${version}`, function () {
            process.version = version;

            _config.checkNodeOk.should.throw();
          });
        }
      });
      describe('supported nodes', function () {
        it('should succeed if node is 12+', function () {
          process.version = '12.20.1';

          _config.checkNodeOk.should.not.throw();
        });
        it('should succeed if node is 13+', function () {
          process.version = '13.14.0';

          _config.checkNodeOk.should.not.throw();
        });
        it('should succeed if node is 14+', function () {
          process.version = '14.15.4';

          _config.checkNodeOk.should.not.throw();
        });
        it('should succeed if node is 15+', function () {
          process.version = '15.5.1';

          _config.checkNodeOk.should.not.throw();
        });
      });
    });
    describe('warnNodeDeprecations', function () {
      let spy;
      before(function () {
        spy = _sinon.default.spy(_logger.default, 'warn');
      });
      beforeEach(function () {
        spy.resetHistory();
      });
      it('should not log a warning if node is 8+', function () {
        process.version = 'v8.0.0';
        (0, _config.warnNodeDeprecations)();

        _logger.default.warn.callCount.should.equal(0);
      });
      it('should not log a warning if node is 9+', function () {
        process.version = 'v9.0.0';
        (0, _config.warnNodeDeprecations)();

        _logger.default.warn.callCount.should.equal(0);
      });
    });
  });
  describe('server arguments', function () {
    let parser = (0, _parser.default)();
    parser.debug = true;
    let args = {};
    beforeEach(function () {
      for (let rawArg of parser.rawArgs) {
        args[rawArg[1].dest] = rawArg[1].default;
      }
    });
    describe('getNonDefaultArgs', function () {
      it('should show none if we have all the defaults', function () {
        let nonDefaultArgs = (0, _config.getNonDefaultArgs)(parser, args);

        _lodash.default.keys(nonDefaultArgs).length.should.equal(0);
      });
      it('should catch a non-default argument', function () {
        args.isolateSimDevice = true;
        let nonDefaultArgs = (0, _config.getNonDefaultArgs)(parser, args);

        _lodash.default.keys(nonDefaultArgs).length.should.equal(1);

        should.exist(nonDefaultArgs.isolateSimDevice);
      });
    });
    describe('getDeprecatedArgs', function () {
      it('should show none if we have no deprecated arguments', function () {
        let deprecatedArgs = (0, _config.getDeprecatedArgs)(parser, args);

        _lodash.default.keys(deprecatedArgs).length.should.equal(0);
      });
      it('should catch a deprecated argument', function () {
        args.showIOSLog = true;
        let deprecatedArgs = (0, _config.getDeprecatedArgs)(parser, args);

        _lodash.default.keys(deprecatedArgs).length.should.equal(1);

        should.exist(deprecatedArgs['--show-ios-log']);
      });
      it('should catch a non-boolean deprecated argument', function () {
        args.calendarFormat = 'orwellian';
        let deprecatedArgs = (0, _config.getDeprecatedArgs)(parser, args);

        _lodash.default.keys(deprecatedArgs).length.should.equal(1);

        should.exist(deprecatedArgs['--calendar-format']);
      });
    });
  });
  describe('checkValidPort', function () {
    it('should be false for port too high', function () {
      (0, _config.checkValidPort)(65536).should.be.false;
    });
    it('should be false for port too low', function () {
      (0, _config.checkValidPort)(0).should.be.false;
    });
    it('should be true for port 1', function () {
      (0, _config.checkValidPort)(1).should.be.true;
    });
    it('should be true for port 65535', function () {
      (0, _config.checkValidPort)(65535).should.be.true;
    });
  });
  describe('validateTmpDir', function () {
    it('should fail to use a tmp dir with incorrect permissions', function () {
      (0, _config.validateTmpDir)('/private/if_you_run_with_sudo_this_wont_fail').should.be.rejectedWith(/could not ensure/);
    });
    it('should fail to use an undefined tmp dir', function () {
      (0, _config.validateTmpDir)().should.be.rejectedWith(/could not ensure/);
    });
    it('should be able to use a tmp dir with correct permissions', function () {
      (0, _config.validateTmpDir)('/tmp/test_tmp_dir/with/any/number/of/levels').should.not.be.rejected;
    });
  });
  describe('parsing args with empty argv[1]', function () {
    let argv1;
    before(function () {
      argv1 = process.argv[1];
    });
    after(function () {
      process.argv[1] = argv1;
    });
    it('should not fail if process.argv[1] is undefined', function () {
      process.argv[1] = undefined;
      let args = (0, _parser.default)();
      args.prog.should.be.equal('Appium');
    });
    it('should set "prog" to process.argv[1]', function () {
      process.argv[1] = 'Hello World';
      let args = (0, _parser.default)();
      args.prog.should.be.equal('Hello World');
    });
  });
  describe('validateServerArgs', function () {
    let parser = (0, _parser.default)();
    parser.debug = true;
    const defaultArgs = {};

    for (let rawArg of parser.rawArgs) {
      defaultArgs[rawArg[1].dest] = rawArg[1].default;
    }

    let args = {};
    beforeEach(function () {
      args = _lodash.default.clone(defaultArgs);
    });
    describe('mutually exclusive server arguments', function () {
      describe('noReset and fullReset', function () {
        it('should not allow both', function () {
          (() => {
            args.noReset = args.fullReset = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.throw();
        });
        it('should allow noReset', function () {
          (() => {
            args.noReset = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.not.throw();
        });
        it('should allow fullReset', function () {
          (() => {
            args.fullReset = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.not.throw();
        });
      });
      describe('ipa and safari', function () {
        it('should not allow both', function () {
          (() => {
            args.ipa = args.safari = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.throw();
        });
        it('should allow ipa', function () {
          (() => {
            args.ipa = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.not.throw();
        });
        it('should allow safari', function () {
          (() => {
            args.safari = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.not.throw();
        });
      });
      describe('app and safari', function () {
        it('should not allow both', function () {
          (() => {
            args.app = args.safari = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.throw();
        });
        it('should allow app', function () {
          (() => {
            args.app = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.not.throw();
        });
      });
      describe('forceIphone and forceIpad', function () {
        it('should not allow both', function () {
          (() => {
            args.forceIphone = args.forceIpad = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.throw();
        });
        it('should allow forceIphone', function () {
          (() => {
            args.forceIphone = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.not.throw();
        });
        it('should allow forceIpad', function () {
          (() => {
            args.forceIpad = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.not.throw();
        });
      });
      describe('deviceName and defaultDevice', function () {
        it('should not allow both', function () {
          (() => {
            args.deviceName = args.defaultDevice = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.throw();
        });
        it('should allow deviceName', function () {
          (() => {
            args.deviceName = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.not.throw();
        });
        it('should allow defaultDevice', function () {
          (() => {
            args.defaultDevice = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.not.throw();
        });
      });
    });
    describe('validated arguments', function () {
      describe('backendRetries', function () {
        it('should fail with value less than 0', function () {
          args.backendRetries = -1;
          (() => {
            (0, _config.validateServerArgs)(parser, args);
          }).should.throw();
        });
        it('should succeed with value of 0', function () {
          args.backendRetries = 0;
          (() => {
            (0, _config.validateServerArgs)(parser, args);
          }).should.not.throw();
        });
        it('should succeed with value above 0', function () {
          args.backendRetries = 100;
          (() => {
            (0, _config.validateServerArgs)(parser, args);
          }).should.not.throw();
        });
      });
    });
  });
});require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvY29uZmlnLXNwZWNzLmpzIl0sIm5hbWVzIjpbInNob3VsZCIsImNoYWkiLCJ1c2UiLCJjaGFpQXNQcm9taXNlZCIsImRlc2NyaWJlIiwiaXQiLCJyZXYiLCJiZSIsImEiLCJsZW5ndGgiLCJlcXVhbCIsIm1hdGNoIiwiZXFsIiwidmVyaWZ5QnVpbGRJbmZvVXBkYXRlIiwidXNlTG9jYWxHaXQiLCJidWlsZEluZm8iLCJtb2NrRnMiLCJleHBlY3RzIiwiYXRMZWFzdCIsInJldHVybnMiLCJ1bmRlZmluZWQiLCJidWlsdCIsImFuIiwiZXhpc3QiLCJ2ZXJzaW9uIiwiZ2V0U3R1YiIsImJlZm9yZUVhY2giLCJzaW5vbiIsIm1vY2siLCJmcyIsInN0dWIiLCJheGlvcyIsImFmdGVyRWFjaCIsInJlc3RvcmUiLCJvbkNhbGwiLCJkYXRhIiwiQVBQSVVNX1ZFUiIsImJlZm9yZSIsInNweSIsImNvbnNvbGUiLCJjb25maWciLCJsb2ciLCJjYWxsZWRPbmNlIiwidHJ1ZSIsImdldENhbGwiLCJhcmdzIiwiY29udGFpbiIsIkpTT04iLCJzdHJpbmdpZnkiLCJfcHJvY2VzcyIsInByb2Nlc3MiLCJ0ZW1wUHJvY2VzcyIsInByb3AiLCJ2YWx1ZSIsIl8iLCJ0b1BhaXJzIiwiYWZ0ZXIiLCJ1bnN1cHBvcnRlZFZlcnNpb25zIiwiY2hlY2tOb2RlT2siLCJ0aHJvdyIsIm5vdCIsImxvZ2dlciIsInJlc2V0SGlzdG9yeSIsIndhcm4iLCJjYWxsQ291bnQiLCJwYXJzZXIiLCJkZWJ1ZyIsInJhd0FyZyIsInJhd0FyZ3MiLCJkZXN0IiwiZGVmYXVsdCIsIm5vbkRlZmF1bHRBcmdzIiwia2V5cyIsImlzb2xhdGVTaW1EZXZpY2UiLCJkZXByZWNhdGVkQXJncyIsInNob3dJT1NMb2ciLCJjYWxlbmRhckZvcm1hdCIsImZhbHNlIiwicmVqZWN0ZWRXaXRoIiwicmVqZWN0ZWQiLCJhcmd2MSIsImFyZ3YiLCJwcm9nIiwiZGVmYXVsdEFyZ3MiLCJjbG9uZSIsIm5vUmVzZXQiLCJmdWxsUmVzZXQiLCJpcGEiLCJzYWZhcmkiLCJhcHAiLCJmb3JjZUlwaG9uZSIsImZvcmNlSXBhZCIsImRldmljZU5hbWUiLCJkZWZhdWx0RGV2aWNlIiwiYmFja2VuZFJldHJpZXMiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUlBOztBQUNBOztBQUNBOztBQUNBOztBQUVBLElBQUlBLE1BQU0sR0FBR0MsY0FBS0QsTUFBTCxFQUFiOztBQUNBQyxjQUFLQyxHQUFMLENBQVNDLHVCQUFUOztBQUdBQyxRQUFRLENBQUMsUUFBRCxFQUFXLFlBQVk7QUFDN0JBLEVBQUFBLFFBQVEsQ0FBQyxXQUFELEVBQWMsWUFBWTtBQUNoQ0MsSUFBQUEsRUFBRSxDQUFDLHNDQUFELEVBQXlDLGtCQUFrQjtBQUMzRCxVQUFJQyxHQUFHLEdBQUcsTUFBTSx3QkFBaEI7QUFDQUEsTUFBQUEsR0FBRyxDQUFDTixNQUFKLENBQVdPLEVBQVgsQ0FBY0MsQ0FBZCxDQUFnQixRQUFoQjtBQUNBRixNQUFBQSxHQUFHLENBQUNHLE1BQUosQ0FBV1QsTUFBWCxDQUFrQk8sRUFBbEIsQ0FBcUJHLEtBQXJCLENBQTJCLEVBQTNCO0FBQ0FKLE1BQUFBLEdBQUcsQ0FBQ0ssS0FBSixDQUFVLFlBQVYsRUFBd0IsQ0FBeEIsRUFBMkJYLE1BQTNCLENBQWtDWSxHQUFsQyxDQUFzQ04sR0FBdEM7QUFDRCxLQUxDLENBQUY7QUFNRCxHQVBPLENBQVI7QUFTQUYsRUFBQUEsUUFBUSxDQUFDLGVBQUQsRUFBa0IsWUFBWTtBQUNwQ0EsSUFBQUEsUUFBUSxDQUFDLGNBQUQsRUFBaUIsWUFBWTtBQUNuQyxxQkFBZVMscUJBQWYsQ0FBc0NDLFdBQXRDLEVBQW1EO0FBQ2pELGNBQU1DLFNBQVMsR0FBRywyQkFBbEI7QUFDQUMsUUFBQUEsTUFBTSxDQUFDQyxPQUFQLENBQWUsUUFBZixFQUF5QkMsT0FBekIsQ0FBaUMsQ0FBakMsRUFBb0NDLE9BQXBDLENBQTRDTCxXQUE1QztBQUNBQyxRQUFBQSxTQUFT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Q2lELGNBQUwsR0FBc0IsR0FBdEI7QUFDQSxXQUFDLE1BQU07QUFBQyw0Q0FBbUI3QixNQUFuQixFQUEyQnBCLElBQTNCO0FBQWtDLFdBQTFDLEVBQTRDN0MsTUFBNUMsQ0FBbUQ0RCxHQUFuRCxDQUF1REQsS0FBdkQ7QUFDRCxTQUhDLENBQUY7QUFJRCxPQWJPLENBQVI7QUFjRCxLQWpCTyxDQUFSO0FBa0JELEdBOUhPLENBQVI7QUErSEQsQ0FqWk8sQ0FBUiIsInNvdXJjZXNDb250ZW50IjpbIi8vIHRyYW5zcGlsZTptb2NoYVxuXG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IGNoYWkgZnJvbSAnY2hhaSc7XG5pbXBvcnQgc2lub24gZnJvbSAnc2lub24nO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuaW1wb3J0IHsgZ2V0R2l0UmV2LCBnZXRCdWlsZEluZm8sIGNoZWNrTm9kZU9rLCB3YXJuTm9kZURlcHJlY2F0aW9ucyxcbiAgICAgICAgIGdldE5vbkRlZmF1bHRBcmdzLCBnZXREZXByZWNhdGVkQXJncywgdmFsaWRhdGVTZXJ2ZXJBcmdzLFxuICAgICAgICAgdmFsaWRhdGVUbXBEaXIsIHNob3dDb25maWcsIGNoZWNrVmFsaWRQb3J0LCB1cGRhdGVCdWlsZEluZm8sXG4gICAgICAgICBBUFBJVU1fVkVSIH0gZnJvbSAnLi4vbGliL2NvbmZpZyc7XG5pbXBvcnQgZ2V0UGFyc2VyIGZyb20gJy4uL2xpYi9wYXJzZXInO1xuaW1wb3J0IGxvZ2dlciBmcm9tICcuLi9saWIvbG9nZ2VyJztcbmltcG9ydCB7IGZzIH0gZnJvbSAnYXBwaXVtLXN1cHBvcnQnO1xuaW1wb3J0IGF4aW9zIGZyb20gJ2F4aW9zJztcblxubGV0IHNob3VsZCA9IGNoYWkuc2hvdWxkKCk7XG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5cblxuZGVzY3JpYmUoJ0NvbmZpZycsIGZ1bmN0aW9uICgpIHtcbiAgZGVzY3JpYmUoJ2dldEdpdFJldicsIGZ1bmN0aW9uICgpIHtcbiAgICBpdCgnc2hvdWxkIGdldCBhIHJlYXNvbmFibGUgZ2l0IHJldmlzaW9uJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IHJldiA9IGF3YWl0IGdldEdpdFJldigpO1xuICAgICAgcmV2LnNob3VsZC5iZS5hKCdzdHJpbmcnKTtcbiAgICAgIHJldi5sZW5ndGguc2hvdWxkLmJlLmVxdWFsKDQwKTtcbiAgICAgIHJldi5tYXRjaCgvWzAtOWEtZl0rL2kpWzBdLnNob3VsZC5lcWwocmV2KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0FwcGl1bSBjb25maWcnLCBmdW5jdGlvbiAoKSB7XG4gICAgZGVzY3JpYmUoJ2dldEJ1aWxkSW5mbycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGFzeW5jIGZ1bmN0aW9uIHZlcmlmeUJ1aWxkSW5mb1VwZGF0ZSAodXNlTG9jYWxHaXQpIHtcbiAgICAgICAgY29uc3QgYnVpbGRJbmZvID0gZ2V0QnVpbGRJbmZvKCk7XG4gICAgICAgIG1vY2tGcy5leHBlY3RzKCdleGlzdHMnKS5hdExlYXN0KDEpLnJldHVybnModXNlTG9jYWxHaXQpO1xuICAgICAgICBidWlsZEluZm9bJ2dpdC1zaGEnXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgYnVpbGRJbmZvLmJ1aWx0ID0gdW5kZWZpbmVkO1xuICAgICAgICBhd2FpdCB1cGRhdGVCdWlsZEluZm8odHJ1ZSk7XG4gICAgICAgIGJ1aWxkSW5mby5zaG91bGQuYmUuYW4oJ29iamVjdCcpO1xuICAgICAgICBzaG91bGQuZXhpc3QoYnVpbGRJbmZvWydnaXQtc2hhJ10pO1xuICAgICAgICBzaG91bGQuZXhpc3QoYnVpbGRJbmZvLmJ1aWx0KTtcbiAgICAgICAgc2hvdWxkLmV4aXN0KGJ1aWxkSW5mby52ZXJzaW9uKTtcbiAgICAgIH1cblxuICAgICAgbGV0IG1vY2tGcztcbiAgICAgIGxldCBnZXRTdHViO1xuICAgICAgYmVmb3JlRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tGcyA9IHNpbm9uLm1vY2soZnMpO1xuICAgICAgICBnZXRTdHViID0gc2lub24uc3R1YihheGlvcywgJ2dldCcpO1xuICAgICAgfSk7XG4gICAgICBhZnRlckVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICBnZXRTdHViLnJlc3RvcmUoKTtcbiAgICAgICAgbW9ja0ZzLnJlc3RvcmUoKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIGdldCBhIGNvbmZpZ3VyYXRpb24gb2JqZWN0IGlmIHRoZSBsb2NhbCBnaXQgbWV0YWRhdGEgaXMgcHJlc2VudCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYXdhaXQgdmVyaWZ5QnVpbGRJbmZvVXBkYXRlKHRydWUpO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGdldCBhIGNvbmZpZ3VyYXRpb24gb2JqZWN0IGlmIHRoZSBsb2NhbCBnaXQgbWV0YWRhdGEgaXMgbm90IHByZXNlbnQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGdldFN0dWIub25DYWxsKDApLnJldHVybnMoe2RhdGE6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICAnbmFtZSc6IGB2JHtBUFBJVU1fVkVSfWAsXG4gICAgICAgICAgICAnemlwYmFsbF91cmwnOiAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy9hcHBpdW0vYXBwaXVtL3ppcGJhbGwvdjEuOS4wLWJldGEuMScsXG4gICAgICAgICAgICAndGFyYmFsbF91cmwnOiAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy9hcHBpdW0vYXBwaXVtL3RhcmJhbGwvdjEuOS4wLWJldGEuMScsXG4gICAgICAgICAgICAnY29tbWl0Jzoge1xuICAgICAgICAgICAgICAnc2hhJzogJzNjMjc1MmY5ZjljNTYwMDA3MDVhNGFlMTViM2JhNjhhNWQyZTY0NGMnLFxuICAgICAgICAgICAgICAndXJsJzogJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvYXBwaXVtL2FwcGl1bS9jb21taXRzLzNjMjc1MmY5ZjljNTYwMDA3MDVhNGFlMTViM2JhNjhhNWQyZTY0NGMnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ25vZGVfaWQnOiAnTURNNlVtVm1OelV6TURVM01EcDJNUzQ1TGpBdFltVjBZUzR4J1xuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgJ25hbWUnOiAndjEuOC4yLWJldGEnLFxuICAgICAgICAgICAgJ3ppcGJhbGxfdXJsJzogJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvYXBwaXVtL2FwcGl1bS96aXBiYWxsL3YxLjguMi1iZXRhJyxcbiAgICAgICAgICAgICd0YXJiYWxsX3VybCc6ICdodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zL2FwcGl1bS9hcHBpdW0vdGFyYmFsbC92MS44LjItYmV0YScsXG4gICAgICAgICAgICAnY29tbWl0Jzoge1xuICAgICAgICAgICAgICAnc2hhJzogJzViOThiOTE5N2U3NWFhODVlNzUwN2QyMWQzMTI2YzFhNjNkMWNlOGYnLFxuICAgICAgICAgICAgICAndXJsJzogJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvYXBwaXVtL2FwcGl1bS9jb21taXRzLzViOThiOTE5N2U3NWFhODVlNzUwN2QyMWQzMTI2YzFhNjNkMWNlOGYnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ25vZGVfaWQnOiAnTURNNlVtVm1OelV6TURVM01EcDJNUzQ0TGpJdFltVjBZUT09J1xuICAgICAgICAgIH1cbiAgICAgICAgXX0pO1xuICAgICAgICBnZXRTdHViLm9uQ2FsbCgxKS5yZXR1cm5zKHtkYXRhOiB7XG4gICAgICAgICAgJ3NoYSc6ICczYzI3NTJmOWY5YzU2MDAwNzA1YTRhZTE1YjNiYTY4YTVkMmU2NDRjJyxcbiAgICAgICAgICAnbm9kZV9pZCc6ICdNRFk2UTI5dGJXbDBOelV6TURVM01Eb3pZekkzTlRKbU9XWTVZelUyTURBd056QTFZVFJoWlRFMVlqTmlZVFk0WVRWa01tVTJORFJqJyxcbiAgICAgICAgICAnY29tbWl0Jzoge1xuICAgICAgICAgICAgJ2F1dGhvcic6IHtcbiAgICAgICAgICAgICAgJ25hbWUnOiAnSXNhYWMgTXVyY2hpZScsXG4gICAgICAgICAgICAgICdlbWFpbCc6ICdpc2FhY0BzYXVjZWxhYnMuY29tJyxcbiAgICAgICAgICAgICAgJ2RhdGUnOiAnMjAxOC0wOC0xN1QxOTo0ODowMFonXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ2NvbW1pdHRlcic6IHtcbiAgICAgICAgICAgICAgJ25hbWUnOiAnSXNhYWMgTXVyY2hpZScsXG4gICAgICAgICAgICAgICdlbWFpbCc6ICdpc2FhY0BzYXVjZWxhYnMuY29tJyxcbiAgICAgICAgICAgICAgJ2RhdGUnOiAnMjAxOC0wOC0xN1QxOTo0ODowMFonXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ21lc3NhZ2UnOiAndjEuOS4wLWJldGEuMScsXG4gICAgICAgICAgICAndHJlZSc6IHtcbiAgICAgICAgICAgICAgJ3NoYSc6ICcyYzA5NzQ3Mjc0NzBlYmE0MTllYTBiOTk1MWM1MmY3MmY4MDM2YjE4JyxcbiAgICAgICAgICAgICAgJ3VybCc6ICdodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zL2FwcGl1bS9hcHBpdW0vZ2l0L3RyZWVzLzJjMDk3NDcyNzQ3MGViYTQxOWVhMGI5OTUxYzUyZjcyZjgwMzZiMTgnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ3VybCc6ICdodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zL2FwcGl1bS9hcHBpdW0vZ2l0L2NvbW1pdHMvM2MyNzUyZjlmOWM1NjAwMDcwNWE0YWUxNWIzYmE2OGE1ZDJlNjQ0YycsXG4gICAgICAgICAgICAnY29tbWVudF9jb3VudCc6IDAsXG4gICAgICAgICAgICAndmVyaWZpY2F0aW9uJzoge1xuICAgICAgICAgICAgICAndmVyaWZpZWQnOiBmYWxzZSxcbiAgICAgICAgICAgICAgJ3JlYXNvbic6ICd1bnNpZ25lZCcsXG4gICAgICAgICAgICAgICdzaWduYXR1cmUnOiBudWxsLFxuICAgICAgICAgICAgICAncGF5bG9hZCc6IG51bGxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgICd1cmwnOiAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy9hcHBpdW0vYXBwaXVtL2NvbW1pdHMvM2MyNzUyZjlmOWM1NjAwMDcwNWE0YWUxNWIzYmE2OGE1ZDJlNjQ0YycsXG4gICAgICAgICAgJ2h0bWxfdXJsJzogJ2h0dHBzOi8vZ2l0aHViLmNvbS9hcHBpdW0vYXBwaXVtL2NvbW1pdC8zYzI3NTJmOWY5YzU2MDAwNzA1YTRhZTE1YjNiYTY4YTVkMmU2NDRjJyxcbiAgICAgICAgICAnY29tbWVudHNfdXJsJzogJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvYXBwaXVtL2FwcGl1bS9jb21taXRzLzNjMjc1MmY5ZjljNTYwMDA3MDVhNGFlMTViM2JhNjhhNWQyZTY0NGMvY29tbWVudHMnLFxuICAgICAgICB9fSk7XG4gICAgICAgIGF3YWl0IHZlcmlmeUJ1aWxkSW5mb1VwZGF0ZShmYWxzZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgnc2hvd0NvbmZpZycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGJlZm9yZShmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNpbm9uLnNweShjb25zb2xlLCAnbG9nJyk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgbG9nIHRoZSBjb25maWcgdG8gY29uc29sZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gZ2V0QnVpbGRJbmZvKCk7XG4gICAgICAgIGF3YWl0IHNob3dDb25maWcoKTtcbiAgICAgICAgY29uc29sZS5sb2cuY2FsbGVkT25jZS5zaG91bGQuYmUudHJ1ZTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgIGNvbnNvbGUubG9nLmdldENhbGwoMCkuYXJnc1swXS5zaG91bGQuY29udGFpbihKU09OLnN0cmluZ2lmeShjb25maWcpKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ25vZGUuanMgY29uZmlnJywgZnVuY3Rpb24gKCkge1xuICAgIGxldCBfcHJvY2VzcyA9IHByb2Nlc3M7XG4gICAgYmVmb3JlKGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIG5lZWQgdG8gYmUgYWJsZSB0byB3cml0ZSB0byBwcm9jZXNzLnZlcnNpb25cbiAgICAgIC8vIGJ1dCBhbHNvIHRvIGhhdmUgYWNjZXNzIHRvIHByb2Nlc3MgbWV0aG9kc1xuICAgICAgLy8gc28gY29weSB0aGVtIG92ZXIgdG8gYSB3cml0YWJsZSBvYmplY3RcbiAgICAgIGxldCB0ZW1wUHJvY2VzcyA9IHt9O1xuICAgICAgZm9yIChsZXQgW3Byb3AsIHZhbHVlXSBvZiBfLnRvUGFpcnMocHJvY2VzcykpIHtcbiAgICAgICAgdGVtcFByb2Nlc3NbcHJvcF0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIHByb2Nlc3MgPSB0ZW1wUHJvY2VzczsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1nbG9iYWwtYXNzaWduXG4gICAgfSk7XG4gICAgYWZ0ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgcHJvY2VzcyA9IF9wcm9jZXNzOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWdsb2JhbC1hc3NpZ25cbiAgICB9KTtcbiAgICBkZXNjcmliZSgnY2hlY2tOb2RlT2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICBkZXNjcmliZSgndW5zdXBwb3J0ZWQgbm9kZXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IHVuc3VwcG9ydGVkVmVyc2lvbnMgPSBbXG4gICAgICAgICAgJ3YwLjEnLCAndjAuOS4xMicsICd2MC4xMC4zNicsICd2MC4xMi4xNCcsXG4gICAgICAgICAgJ3Y0LjQuNycsICd2NS43LjAnLCAndjYuMy4xJywgJ3Y3LjEuMScsICd2OC4xLjInLFxuICAgICAgICAgICd2OS4xLjInLCAndjEwLjAuMScsICd2MTEuNi4wJ1xuICAgICAgICBdO1xuICAgICAgICBmb3IgKGNvbnN0IHZlcnNpb24gb2YgdW5zdXBwb3J0ZWRWZXJzaW9ucykge1xuICAgICAgICAgIGl0KGBzaG91bGQgZmFpbCBpZiBub2RlIGlzICR7dmVyc2lvbn1gLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBwcm9jZXNzLnZlcnNpb24gPSB2ZXJzaW9uO1xuICAgICAgICAgICAgY2hlY2tOb2RlT2suc2hvdWxkLnRocm93KCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBkZXNjcmliZSgnc3VwcG9ydGVkIG5vZGVzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpdCgnc2hvdWxkIHN1Y2NlZWQgaWYgbm9kZSBpcyAxMisnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcHJvY2Vzcy52ZXJzaW9uID0gJzEyLjIwLjEnO1xuICAgICAgICAgIGNoZWNrTm9kZU9rLnNob3VsZC5ub3QudGhyb3coKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGl0KCdzaG91bGQgc3VjY2VlZCBpZiBub2RlIGlzIDEzKycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBwcm9jZXNzLnZlcnNpb24gPSAnMTMuMTQuMCc7XG4gICAgICAgICAgY2hlY2tOb2RlT2suc2hvdWxkLm5vdC50aHJvdygpO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCBzdWNjZWVkIGlmIG5vZGUgaXMgMTQrJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHByb2Nlc3MudmVyc2lvbiA9ICcxNC4xNS40JztcbiAgICAgICAgICBjaGVja05vZGVPay5zaG91bGQubm90LnRocm93KCk7XG4gICAgICAgIH0pO1xuICAgICAgICBpdCgnc2hvdWxkIHN1Y2NlZWQgaWYgbm9kZSBpcyAxNSsnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcHJvY2Vzcy52ZXJzaW9uID0gJzE1LjUuMSc7XG4gICAgICAgICAgY2hlY2tOb2RlT2suc2hvdWxkLm5vdC50aHJvdygpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ3dhcm5Ob2RlRGVwcmVjYXRpb25zJywgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IHNweTtcbiAgICAgIGJlZm9yZShmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNweSA9IHNpbm9uLnNweShsb2dnZXIsICd3YXJuJyk7XG4gICAgICB9KTtcbiAgICAgIGJlZm9yZUVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICBzcHkucmVzZXRIaXN0b3J5KCk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgbm90IGxvZyBhIHdhcm5pbmcgaWYgbm9kZSBpcyA4KycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcHJvY2Vzcy52ZXJzaW9uID0gJ3Y4LjAuMCc7XG4gICAgICAgIHdhcm5Ob2RlRGVwcmVjYXRpb25zKCk7XG4gICAgICAgIGxvZ2dlci53YXJuLmNhbGxDb3VudC5zaG91bGQuZXF1YWwoMCk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgbm90IGxvZyBhIHdhcm5pbmcgaWYgbm9kZSBpcyA5KycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcHJvY2Vzcy52ZXJzaW9uID0gJ3Y5LjAuMCc7XG4gICAgICAgIHdhcm5Ob2RlRGVwcmVjYXRpb25zKCk7XG4gICAgICAgIGxvZ2dlci53YXJuLmNhbGxDb3VudC5zaG91bGQuZXF1YWwoMCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3NlcnZlciBhcmd1bWVudHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IHBhcnNlciA9IGdldFBhcnNlcigpO1xuICAgIHBhcnNlci5kZWJ1ZyA9IHRydWU7IC8vIHRocm93IGluc3RlYWQgb2YgZXhpdCBvbiBlcnJvcjsgcGFzcyBhcyBvcHRpb24gaW5zdGVhZD9cbiAgICBsZXQgYXJncyA9IHt9O1xuICAgIGJlZm9yZUVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgLy8gZ2l2ZSBhbGwgdGhlIGRlZmF1bHRzXG4gICAgICBmb3IgKGxldCByYXdBcmcgb2YgcGFyc2VyLnJhd0FyZ3MpIHtcbiAgICAgICAgYXJnc1tyYXdBcmdbMV0uZGVzdF0gPSByYXdBcmdbMV0uZGVmYXVsdDtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBkZXNjcmliZSgnZ2V0Tm9uRGVmYXVsdEFyZ3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnc2hvdWxkIHNob3cgbm9uZSBpZiB3ZSBoYXZlIGFsbCB0aGUgZGVmYXVsdHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCBub25EZWZhdWx0QXJncyA9IGdldE5vbkRlZmF1bHRBcmdzKHBhcnNlciwgYXJncyk7XG4gICAgICAgIF8ua2V5cyhub25EZWZhdWx0QXJncykubGVuZ3RoLnNob3VsZC5lcXVhbCgwKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBjYXRjaCBhIG5vbi1kZWZhdWx0IGFyZ3VtZW50JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBhcmdzLmlzb2xhdGVTaW1EZXZpY2UgPSB0cnVlO1xuICAgICAgICBsZXQgbm9uRGVmYXVsdEFyZ3MgPSBnZXROb25EZWZhdWx0QXJncyhwYXJzZXIsIGFyZ3MpO1xuICAgICAgICBfLmtleXMobm9uRGVmYXVsdEFyZ3MpLmxlbmd0aC5zaG91bGQuZXF1YWwoMSk7XG4gICAgICAgIHNob3VsZC5leGlzdChub25EZWZhdWx0QXJncy5pc29sYXRlU2ltRGV2aWNlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ2dldERlcHJlY2F0ZWRBcmdzJywgZnVuY3Rpb24gKCkge1xuICAgICAgaXQoJ3Nob3VsZCBzaG93IG5vbmUgaWYgd2UgaGF2ZSBubyBkZXByZWNhdGVkIGFyZ3VtZW50cycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IGRlcHJlY2F0ZWRBcmdzID0gZ2V0RGVwcmVjYXRlZEFyZ3MocGFyc2VyLCBhcmdzKTtcbiAgICAgICAgXy5rZXlzKGRlcHJlY2F0ZWRBcmdzKS5sZW5ndGguc2hvdWxkLmVxdWFsKDApO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGNhdGNoIGEgZGVwcmVjYXRlZCBhcmd1bWVudCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYXJncy5zaG93SU9TTG9nID0gdHJ1ZTtcbiAgICAgICAgbGV0IGRlcHJlY2F0ZWRBcmdzID0gZ2V0RGVwcmVjYXRlZEFyZ3MocGFyc2VyLCBhcmdzKTtcbiAgICAgICAgXy5rZXlzKGRlcHJlY2F0ZWRBcmdzKS5sZW5ndGguc2hvdWxkLmVxdWFsKDEpO1xuICAgICAgICBzaG91bGQuZXhpc3QoZGVwcmVjYXRlZEFyZ3NbJy0tc2hvdy1pb3MtbG9nJ10pO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGNhdGNoIGEgbm9uLWJvb2xlYW4gZGVwcmVjYXRlZCBhcmd1bWVudCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYXJncy5jYWxlbmRhckZvcm1hdCA9ICdvcndlbGxpYW4nO1xuICAgICAgICBsZXQgZGVwcmVjYXRlZEFyZ3MgPSBnZXREZXByZWNhdGVkQXJncyhwYXJzZXIsIGFyZ3MpO1xuICAgICAgICBfLmtleXMoZGVwcmVjYXRlZEFyZ3MpLmxlbmd0aC5zaG91bGQuZXF1YWwoMSk7XG4gICAgICAgIHNob3VsZC5leGlzdChkZXByZWNhdGVkQXJnc1snLS1jYWxlbmRhci1mb3JtYXQnXSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2NoZWNrVmFsaWRQb3J0JywgZnVuY3Rpb24gKCkge1xuICAgIGl0KCdzaG91bGQgYmUgZmFsc2UgZm9yIHBvcnQgdG9vIGhpZ2gnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBjaGVja1ZhbGlkUG9ydCg2NTUzNikuc2hvdWxkLmJlLmZhbHNlO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgYmUgZmFsc2UgZm9yIHBvcnQgdG9vIGxvdycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNoZWNrVmFsaWRQb3J0KDApLnNob3VsZC5iZS5mYWxzZTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIGJlIHRydWUgZm9yIHBvcnQgMScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNoZWNrVmFsaWRQb3J0KDEpLnNob3VsZC5iZS50cnVlO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgYmUgdHJ1ZSBmb3IgcG9ydCA2NTUzNScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNoZWNrVmFsaWRQb3J0KDY1NTM1KS5zaG91bGQuYmUudHJ1ZTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3ZhbGlkYXRlVG1wRGlyJywgZnVuY3Rpb24gKCkge1xuICAgIGl0KCdzaG91bGQgZmFpbCB0byB1c2UgYSB0bXAgZGlyIHdpdGggaW5jb3JyZWN0IHBlcm1pc3Npb25zJywgZnVuY3Rpb24gKCkge1xuICAgICAgdmFsaWRhdGVUbXBEaXIoJy9wcml2YXRlL2lmX3lvdV9ydW5fd2l0aF9zdWRvX3RoaXNfd29udF9mYWlsJykuc2hvdWxkLmJlLnJlamVjdGVkV2l0aCgvY291bGQgbm90IGVuc3VyZS8pO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgZmFpbCB0byB1c2UgYW4gdW5kZWZpbmVkIHRtcCBkaXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YWxpZGF0ZVRtcERpcigpLnNob3VsZC5iZS5yZWplY3RlZFdpdGgoL2NvdWxkIG5vdCBlbnN1cmUvKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIGJlIGFibGUgdG8gdXNlIGEgdG1wIGRpciB3aXRoIGNvcnJlY3QgcGVybWlzc2lvbnMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YWxpZGF0ZVRtcERpcignL3RtcC90ZXN0X3RtcF9kaXIvd2l0aC9hbnkvbnVtYmVyL29mL2xldmVscycpLnNob3VsZC5ub3QuYmUucmVqZWN0ZWQ7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdwYXJzaW5nIGFyZ3Mgd2l0aCBlbXB0eSBhcmd2WzFdJywgZnVuY3Rpb24gKCkge1xuICAgIGxldCBhcmd2MTtcblxuICAgIGJlZm9yZShmdW5jdGlvbiAoKSB7XG4gICAgICBhcmd2MSA9IHByb2Nlc3MuYXJndlsxXTtcbiAgICB9KTtcblxuICAgIGFmdGVyKGZ1bmN0aW9uICgpIHtcbiAgICAgIHByb2Nlc3MuYXJndlsxXSA9IGFyZ3YxO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBub3QgZmFpbCBpZiBwcm9jZXNzLmFyZ3ZbMV0gaXMgdW5kZWZpbmVkJywgZnVuY3Rpb24gKCkge1xuICAgICAgcHJvY2Vzcy5hcmd2WzFdID0gdW5kZWZpbmVkO1xuICAgICAgbGV0IGFyZ3MgPSBnZXRQYXJzZXIoKTtcbiAgICAgIGFyZ3MucHJvZy5zaG91bGQuYmUuZXF1YWwoJ0FwcGl1bScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBzZXQgXCJwcm9nXCIgdG8gcHJvY2Vzcy5hcmd2WzFdJywgZnVuY3Rpb24gKCkge1xuICAgICAgcHJvY2Vzcy5hcmd2WzFdID0gJ0hlbGxvIFdvcmxkJztcbiAgICAgIGxldCBhcmdzID0gZ2V0UGFyc2VyKCk7XG4gICAgICBhcmdzLnByb2cuc2hvdWxkLmJlLmVxdWFsKCdIZWxsbyBXb3JsZCcpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgndmFsaWRhdGVTZXJ2ZXJBcmdzJywgZnVuY3Rpb24gKCkge1xuICAgIGxldCBwYXJzZXIgPSBnZXRQYXJzZXIoKTtcbiAgICBwYXJzZXIuZGVidWcgPSB0cnVlOyAvLyB0aHJvdyBpbnN0ZWFkIG9mIGV4aXQgb24gZXJyb3I7IHBhc3MgYXMgb3B0aW9uIGluc3RlYWQ/XG4gICAgY29uc3QgZGVmYXVsdEFyZ3MgPSB7fTtcbiAgICAvLyBnaXZlIGFsbCB0aGUgZGVmYXVsdHNcbiAgICBmb3IgKGxldCByYXdBcmcgb2YgcGFyc2VyLnJhd0FyZ3MpIHtcbiAgICAgIGRlZmF1bHRBcmdzW3Jhd0FyZ1sxXS5kZXN0XSA9IHJhd0FyZ1sxXS5kZWZhdWx0O1xuICAgIH1cbiAgICBsZXQgYXJncyA9IHt9O1xuICAgIGJlZm9yZUVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgYXJncyA9IF8uY2xvbmUoZGVmYXVsdEFyZ3MpO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdtdXR1YWxseSBleGNsdXNpdmUgc2VydmVyIGFyZ3VtZW50cycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGRlc2NyaWJlKCdub1Jlc2V0IGFuZCBmdWxsUmVzZXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGl0KCdzaG91bGQgbm90IGFsbG93IGJvdGgnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgKCgpID0+IHtcbiAgICAgICAgICAgIGFyZ3Mubm9SZXNldCA9IGFyZ3MuZnVsbFJlc2V0ID0gdHJ1ZTtcbiAgICAgICAgICAgIHZhbGlkYXRlU2VydmVyQXJncyhwYXJzZXIsIGFyZ3MpO1xuICAgICAgICAgIH0pLnNob3VsZC50aHJvdygpO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCBhbGxvdyBub1Jlc2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICgoKSA9PiB7XG4gICAgICAgICAgICBhcmdzLm5vUmVzZXQgPSB0cnVlO1xuICAgICAgICAgICAgdmFsaWRhdGVTZXJ2ZXJBcmdzKHBhcnNlciwgYXJncyk7XG4gICAgICAgICAgfSkuc2hvdWxkLm5vdC50aHJvdygpO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCBhbGxvdyBmdWxsUmVzZXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgKCgpID0+IHtcbiAgICAgICAgICAgIGFyZ3MuZnVsbFJlc2V0ID0gdHJ1ZTtcbiAgICAgICAgICAgIHZhbGlkYXRlU2VydmVyQXJncyhwYXJzZXIsIGFyZ3MpO1xuICAgICAgICAgIH0pLnNob3VsZC5ub3QudGhyb3coKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIGRlc2NyaWJlKCdpcGEgYW5kIHNhZmFyaScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaXQoJ3Nob3VsZCBub3QgYWxsb3cgYm90aCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAoKCkgPT4ge1xuICAgICAgICAgICAgYXJncy5pcGEgPSBhcmdzLnNhZmFyaSA9IHRydWU7XG4gICAgICAgICAgICB2YWxpZGF0ZVNlcnZlckFyZ3MocGFyc2VyLCBhcmdzKTtcbiAgICAgICAgICB9KS5zaG91bGQudGhyb3coKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGl0KCdzaG91bGQgYWxsb3cgaXBhJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICgoKSA9PiB7XG4gICAgICAgICAgICBhcmdzLmlwYSA9IHRydWU7XG4gICAgICAgICAgICB2YWxpZGF0ZVNlcnZlckFyZ3MocGFyc2VyLCBhcmdzKTtcbiAgICAgICAgICB9KS5zaG91bGQubm90LnRocm93KCk7XG4gICAgICAgIH0pO1xuICAgICAgICBpdCgnc2hvdWxkIGFsbG93IHNhZmFyaScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAoKCkgPT4ge1xuICAgICAgICAgICAgYXJncy5zYWZhcmkgPSB0cnVlO1xuICAgICAgICAgICAgdmFsaWRhdGVTZXJ2ZXJBcmdzKHBhcnNlciwgYXJncyk7XG4gICAgICAgICAgfSkuc2hvdWxkLm5vdC50aHJvdygpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgZGVzY3JpYmUoJ2FwcCBhbmQgc2FmYXJpJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpdCgnc2hvdWxkIG5vdCBhbGxvdyBib3RoJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICgoKSA9PiB7XG4gICAgICAgICAgICBhcmdzLmFwcCA9IGFyZ3Muc2FmYXJpID0gdHJ1ZTtcbiAgICAgICAgICAgIHZhbGlkYXRlU2VydmVyQXJncyhwYXJzZXIsIGFyZ3MpO1xuICAgICAgICAgIH0pLnNob3VsZC50aHJvdygpO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCBhbGxvdyBhcHAnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgKCgpID0+IHtcbiAgICAgICAgICAgIGFyZ3MuYXBwID0gdHJ1ZTtcbiAgICAgICAgICAgIHZhbGlkYXRlU2VydmVyQXJncyhwYXJzZXIsIGFyZ3MpO1xuICAgICAgICAgIH0pLnNob3VsZC5ub3QudGhyb3coKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIGRlc2NyaWJlKCdmb3JjZUlwaG9uZSBhbmQgZm9yY2VJcGFkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpdCgnc2hvdWxkIG5vdCBhbGxvdyBib3RoJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICgoKSA9PiB7XG4gICAgICAgICAgICBhcmdzLmZvcmNlSXBob25lID0gYXJncy5mb3JjZUlwYWQgPSB0cnVlO1xuICAgICAgICAgICAgdmFsaWRhdGVTZXJ2ZXJBcmdzKHBhcnNlciwgYXJncyk7XG4gICAgICAgICAgfSkuc2hvdWxkLnRocm93KCk7XG4gICAgICAgIH0pO1xuICAgICAgICBpdCgnc2hvdWxkIGFsbG93IGZvcmNlSXBob25lJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICgoKSA9PiB7XG4gICAgICAgICAgICBhcmdzLmZvcmNlSXBob25lID0gdHJ1ZTtcbiAgICAgICAgICAgIHZhbGlkYXRlU2VydmVyQXJncyhwYXJzZXIsIGFyZ3MpO1xuICAgICAgICAgIH0pLnNob3VsZC5ub3QudGhyb3coKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGl0KCdzaG91bGQgYWxsb3cgZm9yY2VJcGFkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICgoKSA9PiB7XG4gICAgICAgICAgICBhcmdzLmZvcmNlSXBhZCA9IHRydWU7XG4gICAgICAgICAgICB2YWxpZGF0ZVNlcnZlckFyZ3MocGFyc2VyLCBhcmdzKTtcbiAgICAgICAgICB9KS5zaG91bGQubm90LnRocm93KCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICBkZXNjcmliZSgnZGV2aWNlTmFtZSBhbmQgZGVmYXVsdERldmljZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaXQoJ3Nob3VsZCBub3QgYWxsb3cgYm90aCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAoKCkgPT4ge1xuICAgICAgICAgICAgYXJncy5kZXZpY2VOYW1lID0gYXJncy5kZWZhdWx0RGV2aWNlID0gdHJ1ZTtcbiAgICAgICAgICAgIHZhbGlkYXRlU2VydmVyQXJncyhwYXJzZXIsIGFyZ3MpO1xuICAgICAgICAgIH0pLnNob3VsZC50aHJvdygpO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCBhbGxvdyBkZXZpY2VOYW1lJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICgoKSA9PiB7XG4gICAgICAgICAgICBhcmdzLmRldmljZU5hbWUgPSB0cnVlO1xuICAgICAgICAgICAgdmFsaWRhdGVTZXJ2ZXJBcmdzKHBhcnNlciwgYXJncyk7XG4gICAgICAgICAgfSkuc2hvdWxkLm5vdC50aHJvdygpO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCBhbGxvdyBkZWZhdWx0RGV2aWNlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICgoKSA9PiB7XG4gICAgICAgICAgICBhcmdzLmRlZmF1bHREZXZpY2UgPSB0cnVlO1xuICAgICAgICAgICAgdmFsaWRhdGVTZXJ2ZXJBcmdzKHBhcnNlciwgYXJncyk7XG4gICAgICAgICAgfSkuc2hvdWxkLm5vdC50aHJvdygpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCd2YWxpZGF0ZWQgYXJndW1lbnRzJywgZnVuY3Rpb24gKCkge1xuICAgICAgLy8gY2hlY2tpbmcgcG9ydHMgaXMgYWxyZWFkeSBkb25lLlxuICAgICAgLy8gdGhlIG9ubHkgYXJndW1lbnQgbGVmdCBpcyBgYmFja2VuZFJldHJpZXNgXG4gICAgICBkZXNjcmliZSgnYmFja2VuZFJldHJpZXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGl0KCdzaG91bGQgZmFpbCB3aXRoIHZhbHVlIGxlc3MgdGhhbiAwJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGFyZ3MuYmFja2VuZFJldHJpZXMgPSAtMTtcbiAgICAgICAgICAoKCkgPT4ge3ZhbGlkYXRlU2VydmVyQXJncyhwYXJzZXIsIGFyZ3MpO30pLnNob3VsZC50aHJvdygpO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCBzdWNjZWVkIHdpdGggdmFsdWUgb2YgMCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBhcmdzLmJhY2tlbmRSZXRyaWVzID0gMDtcbiAgICAgICAgICAoKCkgPT4ge3ZhbGlkYXRlU2VydmVyQXJncyhwYXJzZXIsIGFyZ3MpO30pLnNob3VsZC5ub3QudGhyb3coKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGl0KCdzaG91bGQgc3VjY2VlZCB3aXRoIHZhbHVlIGFib3ZlIDAnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgYXJncy5iYWNrZW5kUmV0cmllcyA9IDEwMDtcbiAgICAgICAgICAoKCkgPT4ge3ZhbGlkYXRlU2VydmVyQXJncyhwYXJzZXIsIGFyZ3MpO30pLnNob3VsZC5ub3QudGhyb3coKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59KTtcbiJdLCJmaWxlIjoidGVzdC9jb25maWctc3BlY3MuanMiLCJzb3VyY2VSb290IjoiLi4vLi4ifQ==
