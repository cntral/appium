"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

require("source-map-support/register");

var _appium = require("../lib/appium");

var _appiumFakeDriver = require("appium-fake-driver");

var _helpers = require("./helpers");

var _lodash = _interopRequireDefault(require("lodash"));

var _sinon = _interopRequireDefault(require("sinon"));

var _chai = _interopRequireDefault(require("chai"));

var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));

var _appiumXcuitestDriver = require("appium-xcuitest-driver");

var _appiumIosDriver = require("appium-ios-driver");

var _appiumUiautomator2Driver = require("appium-uiautomator2-driver");

var _asyncbox = require("asyncbox");

var _utils = require("../lib/utils");

_chai.default.should();

_chai.default.use(_chaiAsPromised.default);

const SESSION_ID = 1;
describe('AppiumDriver', function () {
  describe('AppiumDriver', function () {
    function getDriverAndFakeDriver() {
      const appium = new _appium.AppiumDriver({});
      const fakeDriver = new _appiumFakeDriver.FakeDriver();

      const mockFakeDriver = _sinon.default.mock(fakeDriver);

      appium.getDriverAndVersionForCaps = function () {
        return {
          driver: function Driver() {
            return fakeDriver;
          },
          version: '1.2.3'
        };
      };

      return [appium, mockFakeDriver];
    }

    describe('createSession', function () {
      let appium;
      let mockFakeDriver;
      beforeEach(function () {
        [appium, mockFakeDriver] = getDriverAndFakeDriver();
      });
      afterEach(async function () {
        mockFakeDriver.restore();
        await appium.deleteSession(SESSION_ID);
      });
      it(`should call inner driver's createSession with desired capabilities`, async function () {
        mockFakeDriver.expects('createSession').once().withExactArgs(_helpers.BASE_CAPS, undefined, null, []).returns([SESSION_ID, _helpers.BASE_CAPS]);
        await appium.createSession(_helpers.BASE_CAPS);
        mockFakeDriver.verify();
      });
      it(`should call inner driver's createSession with desired and default capabilities`, async function () {
        let defaultCaps = {
          deviceName: 'Emulator'
        };

        let allCaps = _lodash.default.extend(_lodash.default.clone(defaultCaps), _helpers.BASE_CAPS);

        appium.args.defaultCapabilities = defaultCaps;
        mockFakeDriver.expects('createSession').once().withArgs(allCaps).returns([SESSION_ID, allCaps]);
        await appium.createSession(_helpers.BASE_CAPS);
        mockFakeDriver.verify();
      });
      it(`should call inner driver's createSession with desired and default capabilities without overriding caps`, async function () {
        let defaultCaps = {
          platformName: 'Ersatz'
        };
        appium.args.defaultCapabilities = defaultCaps;
        mockFakeDriver.expects('createSession').once().withArgs(_helpers.BASE_CAPS).returns([SESSION_ID, _helpers.BASE_CAPS]);
        await appium.createSession(_helpers.BASE_CAPS);
        mockFakeDriver.verify();
      });
      it('should kill all other sessions if sessionOverride is on', async function () {
        appium.args.sessionOverride = true;
        let fakeDrivers = [new _appiumFakeDriver.FakeDriver(), new _appiumFakeDriver.FakeDriver(), new _appiumFakeDriver.FakeDriver()];

        let mockFakeDrivers = _lodash.default.map(fakeDrivers, fd => _sinon.default.mock(fd));

        mockFakeDrivers[0].expects('deleteSession').once();
        mockFakeDrivers[1].expects('deleteSession').once().throws('Cannot shut down Android driver; it has already shut down');
        mockFakeDrivers[2].expects('deleteSession').once();
        appium.sessions['abc-123-xyz'] = fakeDrivers[0];
        appium.sessions['xyz-321-abc'] = fakeDrivers[1];
        appium.sessions['123-abc-xyz'] = fakeDrivers[2];
        let sessions = await appium.getSessions();
        sessions.should.have.length(3);
        mockFakeDriver.expects('createSession').once().withExactArgs(_helpers.BASE_CAPS, undefined, null, []).returns([SESSION_ID, _helpers.BASE_CAPS]);
        await appium.createSession(_helpers.BASE_CAPS);
        sessions = await appium.getSessions();
        sessions.should.have.length(1);

        for (let mfd of mockFakeDrivers) {
          mfd.verify();
        }

        mockFakeDriver.verify();
      });
      it('should call "createSession" with W3C capabilities argument, if provided', async function () {
        mockFakeDriver.expects('createSession').once().withArgs(null, undefined, _helpers.W3C_CAPS).returns([SESSION_ID, _helpers.BASE_CAPS]);
        await appium.createSession(undefined, undefined, _helpers.W3C_CAPS);
        mockFakeDriver.verify();
      });
      it('should call "createSession" with W3C capabilities argument with additional provided parameters', async function () {
        let w3cCaps = { ..._helpers.W3C_CAPS,
          alwaysMatch: { ..._helpers.W3C_CAPS.alwaysMatch,
            'appium:someOtherParm': 'someOtherParm'
          }
        };
        mockFakeDriver.expects('createSession').once().withArgs(null, undefined, {
          alwaysMatch: { ...w3cCaps.alwaysMatch,
            'appium:someOtherParm': 'someOtherParm'
          },
          firstMatch: [{}]
        }).returns([SESSION_ID, (0, _utils.insertAppiumPrefixes)(_helpers.BASE_CAPS)]);
        await appium.createSession(undefined, undefined, w3cCaps);
        mockFakeDriver.verify();
      });
      it('should call "createSession" with JSONWP capabilities if W3C has incomplete capabilities', async function () {
        let w3cCaps = { ..._helpers.W3C_CAPS,
          alwaysMatch: { ..._helpers.W3C_CAPS.alwaysMatch,
            'appium:someOtherParm': 'someOtherParm'
          }
        };
        let jsonwpCaps = { ..._helpers.BASE_CAPS,
          automationName: 'Fake',
          someOtherParam: 'someOtherParam'
        };
        let expectedW3cCaps = { ...w3cCaps,
          alwaysMatch: { ...w3cCaps.alwaysMatch,
            'appium:automationName': 'Fake',
            'appium:someOtherParam': 'someOtherParam'
          }
        };
        mockFakeDriver.expects('createSession').once().withArgs(jsonwpCaps, undefined, expectedW3cCaps).returns([SESSION_ID, jsonwpCaps]);
        await appium.createSession(jsonwpCaps, undefined, w3cCaps);
        mockFakeDriver.verify();
      });
    });
    describe('deleteSession', function () {
      let appium;
      let mockFakeDriver;
      beforeEach(function () {
        [appium, mockFakeDriver] = getDriverAndFakeDriver();
      });
      afterEach(function () {
        mockFakeDriver.restore();
      });
      it('should remove the session if it is found', async function () {
        let [sessionId] = (await appium.createSession(_helpers.BASE_CAPS)).value;
        let sessions = await appium.getSessions();
        sessions.should.have.length(1);
        await appium.deleteSession(sessionId);
        sessions = await appium.getSessions();
        sessions.should.have.length(0);
      });
      it('should call inner driver\'s deleteSession method', async function () {
        const [sessionId] = (await appium.createSession(_helpers.BASE_CAPS)).value;
        mockFakeDriver.expects('deleteSession').once().withExactArgs(sessionId, []).returns();
        await appium.deleteSession(sessionId);
        mockFakeDriver.verify();
        await mockFakeDriver.object.deleteSession();
      });
    });
    describe('getSessions', function () {
      let appium;
      let sessions;
      before(function () {
        appium = new _appium.AppiumDriver({});
      });
      afterEach(async function () {
        for (let session of sessions) {
          await appium.deleteSession(session.id);
        }
      });
      it('should return an empty array of sessions', async function () {
        sessions = await appium.getSessions();
        sessions.should.be.an('array');
        sessions.should.be.empty;
      });
      it('should return sessions created', async function () {
        let session1 = (await appium.createSession(_lodash.default.extend(_lodash.default.clone(_helpers.BASE_CAPS), {
          cap: 'value'
        }))).value;
        let session2 = (await appium.createSession(_lodash.default.extend(_lodash.default.clone(_helpers.BASE_CAPS), {
          cap: 'other value'
        }))).value;
        sessions = await appium.getSessions();
        sessions.should.be.an('array');
        sessions.should.have.length(2);
        sessions[0].id.should.equal(session1[0]);
        sessions[0].capabilities.should.eql(session1[1]);
        sessions[1].id.should.equal(session2[0]);
        sessions[1].capabilities.should.eql(session2[1]);
      });
    });
    describe('getStatus', function () {
      let appium;
      before(function () {
        appium = new _appium.AppiumDriver({});
      });
      it('should return a status', async function () {
        let status = await appium.getStatus();
        status.build.should.exist;
        status.build.version.should.exist;
      });
    });
    describe('sessionExists', function () {});
    describe('attachUnexpectedShutdownHandler', function () {
      let appium;
      let mockFakeDriver;
      beforeEach(function () {
        [appium, mockFakeDriver] = getDriverAndFakeDriver();
      });
      afterEach(async function () {
        await mockFakeDriver.object.deleteSession();
        mockFakeDriver.restore();
        appium.args.defaultCapabilities = {};
      });
      it('should remove session if inner driver unexpectedly exits with an error', async function () {
        let [sessionId] = (await appium.createSession(_lodash.default.clone(_helpers.BASE_CAPS))).value;

        _lodash.default.keys(appium.sessions).should.contain(sessionId);

        appium.sessions[sessionId].eventEmitter.emit('onUnexpectedShutdown', new Error('Oops'));
        await (0, _asyncbox.sleep)(1);

        _lodash.default.keys(appium.sessions).should.not.contain(sessionId);
      });
      it('should remove session if inner driver unexpectedly exits with no error', async function () {
        let [sessionId] = (await appium.createSession(_lodash.default.clone(_helpers.BASE_CAPS))).value;

        _lodash.default.keys(appium.sessions).should.contain(sessionId);

        appium.sessions[sessionId].eventEmitter.emit('onUnexpectedShutdown');
        await (0, _asyncbox.sleep)(1);

        _lodash.default.keys(appium.sessions).should.not.contain(sessionId);
      });
    });
    describe('getDriverAndVersionForCaps', function () {
      it('should not blow up if user does not provide platformName', function () {
        const appium = new _appium.AppiumDriver({});
        (() => {
          appium.getDriverAndVersionForCaps({});
        }).should.throw(/platformName/);
      });
      it('should ignore automationName Appium', function () {
        const appium = new _appium.AppiumDriver({});
        const {
          driver
        } = appium.getDriverAndVersionForCaps({
          platformName: 'Android',
          automationName: 'Appium'
        });
        driver.should.be.an.instanceof(Function);
        driver.should.equal(_appiumUiautomator2Driver.AndroidUiautomator2Driver);
      });
      it('should get XCUITestDriver driver for automationName of XCUITest', function () {
        const appium = new _appium.AppiumDriver({});
        const {
          driver
        } = appium.getDriverAndVersionForCaps({
          platformName: 'iOS',
          automationName: 'XCUITest'
        });
        driver.should.be.an.instanceof(Function);
        driver.should.equal(_appiumXcuitestDriver.XCUITestDriver);
      });
      it('should get iosdriver for ios < 10', function () {
        const appium = new _appium.AppiumDriver({});
        const caps = {
          platformName: 'iOS',
          platformVersion: '8.0'
        };
        let {
          driver
        } = appium.getDriverAndVersionForCaps(caps);
        driver.should.be.an.instanceof(Function);
        driver.should.equal(_appiumIosDriver.IosDriver);
        caps.platformVersion = '8.1';
        ({
          driver
        } = appium.getDriverAndVersionForCaps(caps));
        driver.should.equal(_appiumIosDriver.IosDriver);
        caps.platformVersion = '9.4';
        ({
          driver
        } = appium.getDriverAndVersionForCaps(caps));
        driver.should.equal(_appiumIosDriver.IosDriver);
        caps.platformVersion = '';
        ({
          driver
        } = appium.getDriverAndVersionForCaps(caps));
        driver.should.equal(_appiumIosDriver.IosDriver);
        caps.platformVersion = 'foo';
        ({
          driver
        } = appium.getDriverAndVersionForCaps(caps));
        driver.should.equal(_appiumIosDriver.IosDriver);
        delete caps.platformVersion;
        ({
          driver
        } = appium.getDriverAndVersionForCaps(caps));
        driver.should.equal(_appiumIosDriver.IosDriver);
      });
      it('should get xcuitestdriver for ios >= 10', function () {
        const appium = new _appium.AppiumDriver({});
        const caps = {
          platformName: 'iOS',
          platformVersion: '10'
        };
        let {
          driver
        } = appium.getDriverAndVersionForCaps(caps);
        driver.should.be.an.instanceof(Function);
        driver.should.equal(_appiumXcuitestDriver.XCUITestDriver);
        caps.platformVersion = '10.0';
        ({
          driver
        } = appium.getDriverAndVersionForCaps(caps));
        driver.should.equal(_appiumXcuitestDriver.XCUITestDriver);
        caps.platformVersion = '10.1';
        ({
          driver
        } = appium.getDriverAndVersionForCaps(caps));
        driver.should.equal(_appiumXcuitestDriver.XCUITestDriver);
        caps.platformVersion = '12.14';
        ({
          driver
        } = appium.getDriverAndVersionForCaps(caps));
        driver.should.equal(_appiumXcuitestDriver.XCUITestDriver);
      });
      it('should be able to handle different cases in automationName', function () {
        const appium = new _appium.AppiumDriver({});
        const caps = {
          platformName: 'iOS',
          platformVersion: '10',
          automationName: 'XcUiTeSt'
        };
        let {
          driver
        } = appium.getDriverAndVersionForCaps(caps);
        driver.should.be.an.instanceof(Function);
        driver.should.equal(_appiumXcuitestDriver.XCUITestDriver);
      });
      it('should be able to handle different case in platformName', function () {
        const appium = new _appium.AppiumDriver({});
        const caps = {
          platformName: 'IoS',
          platformVersion: '10'
        };
        let {
          driver
        } = appium.getDriverAndVersionForCaps(caps);
        driver.should.be.an.instanceof(Function);
        driver.should.equal(_appiumXcuitestDriver.XCUITestDriver);
      });
    });
  });
});require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvZHJpdmVyLXNwZWNzLmpzIl0sIm5hbWVzIjpbImNoYWkiLCJzaG91bGQiLCJ1c2UiLCJjaGFpQXNQcm9taXNlZCIsIlNFU1NJT05fSUQiLCJkZXNjcmliZSIsImdldERyaXZlckFuZEZha2VEcml2ZXIiLCJhcHBpdW0iLCJBcHBpdW1Ecml2ZXIiLCJmYWtlRHJpdmVyIiwiRmFrZURyaXZlciIsIm1vY2tGYWtlRHJpdmVyIiwic2lub24iLCJtb2NrIiwiZ2V0RHJpdmVyQW5kVmVyc2lvbkZvckNhcHMiLCJkcml2ZXIiLCJEcml2ZXIiLCJ2ZXJzaW9uIiwiYmVmb3JlRWFjaCIsImFmdGVyRWFjaCIsInJlc3RvcmUiLCJkZWxldGVTZXNzaW9uIiwiaXQiLCJleHBlY3RzIiwib25jZSIsIndpdGhFeGFjdEFyZ3MiLCJCQVNFX0NBUFMiLCJ1bmRlZmluZWQiLCJyZXR1cm5zIiwiY3JlYXRlU2Vzc2lvbiIsInZlcmlmeSIsImRlZmF1bHRDYXBzIiwiZGV2aWNlTmFtZSIsImFsbENhcHMiLCJfIiwiZXh0ZW5kIiwiY2xvbmUiLCJhcmdzIiwiZGVmYXVsdENhcGFiaWxpdGllcyIsIndpdGhBcmdzIiwicGxhdGZvcm1OYW1lIiwic2Vzc2lvbk92ZXJyaWRlIiwiZmFrZURyaXZlcnMiLCJtb2NrRmFrZURyaXZlcnMiLCJtYXAiLCJmZCIsInRocm93cyIsInNlc3Npb25zIiwiZ2V0U2Vzc2lvbnMiLCJoYXZlIiwibGVuZ3RoIiwibWZkIiwiVzNDX0NBUFMiLCJ3M2NDYXBzIiwiYWx3YXlzTWF0Y2giLCJmaXJzdE1hdGNoIiwianNvbndwQ2FwcyIsImF1dG9tYXRpb25OYW1lIiwic29tZU90aGVyUGFyYW0iLCJleHBlY3RlZFczY0NhcHMiLCJzZXNzaW9uSWQiLCJ2YWx1ZSIsIm9iamVjdCIsImJlZm9yZSIsInNlc3Npb24iLCJpZCIsImJlIiwiYW4iLCJlbXB0eSIsInNlc3Npb24xIiwiY2FwIiwic2Vzc2lvbjIiLCJlcXVhbCIsImNhcGFiaWxpdGllcyIsImVxbCIsInN0YXR1cyIsImdldFN0YXR1cyIsImJ1aWxkIiwiZXhpc3QiLCJrZXlzIiwiY29udGFpbiIsImV2ZW50RW1pdHRlciIsImVtaXQiLCJFcnJvciIsIm5vdCIsInRocm93IiwiaW5zdGFuY2VvZiIsIkZ1bmN0aW9uIiwiQW5kcm9pZFVpYXV0b21hdG9yMkRyaXZlciIsIlhDVUlUZXN0RHJpdmVyIiwiY2FwcyIsInBsYXRmb3JtVmVyc2lvbiIsIklvc0RyaXZlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUFBLGNBQUtDLE1BQUw7O0FBQ0FELGNBQUtFLEdBQUwsQ0FBU0MsdUJBQVQ7O0FBRUEsTUFBTUMsVUFBVSxHQUFHLENBQW5CO0FBRUFDLFFBQVEsQ0FBQyxjQUFELEVBQWlCLFlBQVk7QUFDbkNBLEVBQUFBLFFBQVEsQ0FBQyxjQUFELEVBQWlCLFlBQVk7QUFDbkMsYUFBU0Msc0JBQVQsR0FBbUM7QUFDakMsWUFBTUMsTUFBTSxHQUFHLElBQUlDLG9CQUFKLENBQWlCLEVBQWpCLENBQWY7QUFDQSxZQUFNQyxVQUFVLEdBQUcsSUFBSUMsNEJBQUosRUFBbkI7O0FBQ0EsWUFBTUMsY0FBYyxHQUFHQyxlQUFNQyxJQUFOLENBQVdKLFVBQVgsQ0FBdkI7O0FBQ0FGLE1BQUFBLE1BQU0sQ0FBQ08sMEJBQVAsR0FBb0MsWUFBb0I7QUFDdEQsZUFBTztBQUNMQyxVQUFBQSxNQUFNLEVBQUUsU0FBU0MsTUFBVCxHQUFtQjtBQUN6QixtQkFBT1AsVUFBUDtBQUNELFdBSEk7QUFJTFEsVUFBQUEsT0FBTyxFQUFFO0FBSkosU0FBUDtBQU1ELE9BUEQ7O0FBUUEsYUFBTyxDQUFDVixNQUFELEVBQVNJLGNBQVQsQ0FBUDtBQUNEOztBQUNETixJQUFBQSxRQUFRLENBQUMsZUFBRCxFQUFrQixZQUFZO0FBQ3BDLFVBQUlFLE1BQUo7QUFDQSxVQUFJSSxjQUFKO0FBQ0FPLE1BQUFBLFVB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R0FBRyxJQUFJQyxvQkFBSixDQUFpQixFQUFqQixDQUFmO0FBQ0EsY0FBTWtGLElBQUksR0FBRztBQUNYbEQsVUFBQUEsWUFBWSxFQUFFLEtBREg7QUFFWG1ELFVBQUFBLGVBQWUsRUFBRSxJQUZOO0FBR1hsQyxVQUFBQSxjQUFjLEVBQUU7QUFITCxTQUFiO0FBS0EsWUFBSTtBQUFDMUMsVUFBQUE7QUFBRCxZQUFXUixNQUFNLENBQUNPLDBCQUFQLENBQWtDNEUsSUFBbEMsQ0FBZjtBQUNBM0UsUUFBQUEsTUFBTSxDQUFDZCxNQUFQLENBQWNpRSxFQUFkLENBQWlCQyxFQUFqQixDQUFvQm1CLFVBQXBCLENBQStCQyxRQUEvQjtBQUNBeEUsUUFBQUEsTUFBTSxDQUFDZCxNQUFQLENBQWN1RSxLQUFkLENBQW9CaUIsb0NBQXBCO0FBQ0QsT0FWQyxDQUFGO0FBV0FuRSxNQUFBQSxFQUFFLENBQUMseURBQUQsRUFBNEQsWUFBWTtBQUN4RSxjQUFNZixNQUFNLEdBQUcsSUFBSUMsb0JBQUosQ0FBaUIsRUFBakIsQ0FBZjtBQUNBLGNBQU1rRixJQUFJLEdBQUc7QUFDWGxELFVBQUFBLFlBQVksRUFBRSxLQURIO0FBRVhtRCxVQUFBQSxlQUFlLEVBQUU7QUFGTixTQUFiO0FBSUEsWUFBSTtBQUFDNUUsVUFBQUE7QUFBRCxZQUFXUixNQUFNLENBQUNPLDBCQUFQLENBQWtDNEUsSUFBbEMsQ0FBZjtBQUNBM0UsUUFBQUEsTUFBTSxDQUFDZCxNQUFQLENBQWNpRSxFQUFkLENBQWlCQyxFQUFqQixDQUFvQm1CLFVBQXBCLENBQStCQyxRQUEvQjtBQUNBeEUsUUFBQUEsTUFBTSxDQUFDZCxNQUFQLENBQWN1RSxLQUFkLENBQW9CaUIsb0NBQXBCO0FBQ0QsT0FUQyxDQUFGO0FBVUQsS0FoR08sQ0FBUjtBQWlHRCxHQTVWTyxDQUFSO0FBNlZELENBOVZPLENBQVIiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0cmFuc3BpbGU6bW9jaGFcblxuaW1wb3J0IHsgQXBwaXVtRHJpdmVyIH0gZnJvbSAnLi4vbGliL2FwcGl1bSc7XG5pbXBvcnQgeyBGYWtlRHJpdmVyIH0gZnJvbSAnYXBwaXVtLWZha2UtZHJpdmVyJztcbmltcG9ydCB7IEJBU0VfQ0FQUywgVzNDX0NBUFMgfSBmcm9tICcuL2hlbHBlcnMnO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCBzaW5vbiBmcm9tICdzaW5vbic7XG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcbmltcG9ydCB7IFhDVUlUZXN0RHJpdmVyIH0gZnJvbSAnYXBwaXVtLXhjdWl0ZXN0LWRyaXZlcic7XG5pbXBvcnQgeyBJb3NEcml2ZXIgfSBmcm9tICdhcHBpdW0taW9zLWRyaXZlcic7XG5pbXBvcnQgeyBBbmRyb2lkVWlhdXRvbWF0b3IyRHJpdmVyIH0gZnJvbSAnYXBwaXVtLXVpYXV0b21hdG9yMi1kcml2ZXInO1xuaW1wb3J0IHsgc2xlZXAgfSBmcm9tICdhc3luY2JveCc7XG5pbXBvcnQgeyBpbnNlcnRBcHBpdW1QcmVmaXhlcyB9IGZyb20gJy4uL2xpYi91dGlscyc7XG5cbmNoYWkuc2hvdWxkKCk7XG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5cbmNvbnN0IFNFU1NJT05fSUQgPSAxO1xuXG5kZXNjcmliZSgnQXBwaXVtRHJpdmVyJywgZnVuY3Rpb24gKCkge1xuICBkZXNjcmliZSgnQXBwaXVtRHJpdmVyJywgZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIGdldERyaXZlckFuZEZha2VEcml2ZXIgKCkge1xuICAgICAgY29uc3QgYXBwaXVtID0gbmV3IEFwcGl1bURyaXZlcih7fSk7XG4gICAgICBjb25zdCBmYWtlRHJpdmVyID0gbmV3IEZha2VEcml2ZXIoKTtcbiAgICAgIGNvbnN0IG1vY2tGYWtlRHJpdmVyID0gc2lub24ubW9jayhmYWtlRHJpdmVyKTtcbiAgICAgIGFwcGl1bS5nZXREcml2ZXJBbmRWZXJzaW9uRm9yQ2FwcyA9IGZ1bmN0aW9uICgvKmFyZ3MqLykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGRyaXZlcjogZnVuY3Rpb24gRHJpdmVyICgpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWtlRHJpdmVyO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgdmVyc2lvbjogJzEuMi4zJyxcbiAgICAgICAgfTtcbiAgICAgIH07XG4gICAgICByZXR1cm4gW2FwcGl1bSwgbW9ja0Zha2VEcml2ZXJdO1xuICAgIH1cbiAgICBkZXNjcmliZSgnY3JlYXRlU2Vzc2lvbicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCBhcHBpdW07XG4gICAgICBsZXQgbW9ja0Zha2VEcml2ZXI7XG4gICAgICBiZWZvcmVFYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgW2FwcGl1bSwgbW9ja0Zha2VEcml2ZXJdID0gZ2V0RHJpdmVyQW5kRmFrZURyaXZlcigpO1xuICAgICAgfSk7XG4gICAgICBhZnRlckVhY2goYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2NrRmFrZURyaXZlci5yZXN0b3JlKCk7XG4gICAgICAgIGF3YWl0IGFwcGl1bS5kZWxldGVTZXNzaW9uKFNFU1NJT05fSUQpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KGBzaG91bGQgY2FsbCBpbm5lciBkcml2ZXIncyBjcmVhdGVTZXNzaW9uIHdpdGggZGVzaXJlZCBjYXBhYmlsaXRpZXNgLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tGYWtlRHJpdmVyLmV4cGVjdHMoJ2NyZWF0ZVNlc3Npb24nKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhCQVNFX0NBUFMsIHVuZGVmaW5lZCwgbnVsbCwgW10pXG4gICAgICAgICAgLnJldHVybnMoW1NFU1NJT05fSUQsIEJBU0VfQ0FQU10pO1xuICAgICAgICBhd2FpdCBhcHBpdW0uY3JlYXRlU2Vzc2lvbihCQVNFX0NBUFMpO1xuICAgICAgICBtb2NrRmFrZURyaXZlci52ZXJpZnkoKTtcbiAgICAgIH0pO1xuICAgICAgaXQoYHNob3VsZCBjYWxsIGlubmVyIGRyaXZlcidzIGNyZWF0ZVNlc3Npb24gd2l0aCBkZXNpcmVkIGFuZCBkZWZhdWx0IGNhcGFiaWxpdGllc2AsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IGRlZmF1bHRDYXBzID0ge2RldmljZU5hbWU6ICdFbXVsYXRvcid9O1xuICAgICAgICBsZXQgYWxsQ2FwcyA9IF8uZXh0ZW5kKF8uY2xvbmUoZGVmYXVsdENhcHMpLCBCQVNFX0NBUFMpO1xuICAgICAgICBhcHBpdW0uYXJncy5kZWZhdWx0Q2FwYWJpbGl0aWVzID0gZGVmYXVsdENhcHM7XG4gICAgICAgIG1vY2tGYWtlRHJpdmVyLmV4cGVjdHMoJ2NyZWF0ZVNlc3Npb24nKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEFyZ3MoYWxsQ2FwcylcbiAgICAgICAgICAucmV0dXJucyhbU0VTU0lPTl9JRCwgYWxsQ2Fwc10pO1xuICAgICAgICBhd2FpdCBhcHBpdW0uY3JlYXRlU2Vzc2lvbihCQVNFX0NBUFMpO1xuICAgICAgICBtb2NrRmFrZURyaXZlci52ZXJpZnkoKTtcbiAgICAgIH0pO1xuICAgICAgaXQoYHNob3VsZCBjYWxsIGlubmVyIGRyaXZlcidzIGNyZWF0ZVNlc3Npb24gd2l0aCBkZXNpcmVkIGFuZCBkZWZhdWx0IGNhcGFiaWxpdGllcyB3aXRob3V0IG92ZXJyaWRpbmcgY2Fwc2AsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gYSBkZWZhdWx0IGNhcGFiaWxpdHkgd2l0aCB0aGUgc2FtZSBrZXkgYXMgYSBkZXNpcmVkIGNhcGFiaWxpdHlcbiAgICAgICAgLy8gc2hvdWxkIGRvIG5vdGhpbmdcbiAgICAgICAgbGV0IGRlZmF1bHRDYXBzID0ge3BsYXRmb3JtTmFtZTogJ0Vyc2F0eid9O1xuICAgICAgICBhcHBpdW0uYXJncy5kZWZhdWx0Q2FwYWJpbGl0aWVzID0gZGVmYXVsdENhcHM7XG4gICAgICAgIG1vY2tGYWtlRHJpdmVyLmV4cGVjdHMoJ2NyZWF0ZVNlc3Npb24nKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEFyZ3MoQkFTRV9DQVBTKVxuICAgICAgICAgIC5yZXR1cm5zKFtTRVNTSU9OX0lELCBCQVNFX0NBUFNdKTtcbiAgICAgICAgYXdhaXQgYXBwaXVtLmNyZWF0ZVNlc3Npb24oQkFTRV9DQVBTKTtcbiAgICAgICAgbW9ja0Zha2VEcml2ZXIudmVyaWZ5KCk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQga2lsbCBhbGwgb3RoZXIgc2Vzc2lvbnMgaWYgc2Vzc2lvbk92ZXJyaWRlIGlzIG9uJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBhcHBpdW0uYXJncy5zZXNzaW9uT3ZlcnJpZGUgPSB0cnVlO1xuXG4gICAgICAgIC8vIG1vY2sgdGhyZWUgc2Vzc2lvbnMgdGhhdCBzaG91bGQgYmUgcmVtb3ZlZCB3aGVuIHRoZSBuZXcgb25lIGlzIGNyZWF0ZWRcbiAgICAgICAgbGV0IGZha2VEcml2ZXJzID0gW1xuICAgICAgICAgIG5ldyBGYWtlRHJpdmVyKCksXG4gICAgICAgICAgbmV3IEZha2VEcml2ZXIoKSxcbiAgICAgICAgICBuZXcgRmFrZURyaXZlcigpLFxuICAgICAgICBdO1xuICAgICAgICBsZXQgbW9ja0Zha2VEcml2ZXJzID0gXy5tYXAoZmFrZURyaXZlcnMsIChmZCkgPT4gc2lub24ubW9jayhmZCkpO1xuICAgICAgICBtb2NrRmFrZURyaXZlcnNbMF0uZXhwZWN0cygnZGVsZXRlU2Vzc2lvbicpXG4gICAgICAgICAgLm9uY2UoKTtcbiAgICAgICAgbW9ja0Zha2VEcml2ZXJzWzFdLmV4cGVjdHMoJ2RlbGV0ZVNlc3Npb24nKVxuICAgICAgICAgIC5vbmNlKClcbiAgICAgICAgICAudGhyb3dzKCdDYW5ub3Qgc2h1dCBkb3duIEFuZHJvaWQgZHJpdmVyOyBpdCBoYXMgYWxyZWFkeSBzaHV0IGRvd24nKTtcbiAgICAgICAgbW9ja0Zha2VEcml2ZXJzWzJdLmV4cGVjdHMoJ2RlbGV0ZVNlc3Npb24nKVxuICAgICAgICAgIC5vbmNlKCk7XG4gICAgICAgIGFwcGl1bS5zZXNzaW9uc1snYWJjLTEyMy14eXonXSA9IGZha2VEcml2ZXJzWzBdO1xuICAgICAgICBhcHBpdW0uc2Vzc2lvbnNbJ3h5ei0zMjEtYWJjJ10gPSBmYWtlRHJpdmVyc1sxXTtcbiAgICAgICAgYXBwaXVtLnNlc3Npb25zWycxMjMtYWJjLXh5eiddID0gZmFrZURyaXZlcnNbMl07XG5cbiAgICAgICAgbGV0IHNlc3Npb25zID0gYXdhaXQgYXBwaXVtLmdldFNlc3Npb25zKCk7XG4gICAgICAgIHNlc3Npb25zLnNob3VsZC5oYXZlLmxlbmd0aCgzKTtcblxuICAgICAgICBtb2NrRmFrZURyaXZlci5leHBlY3RzKCdjcmVhdGVTZXNzaW9uJylcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoQkFTRV9DQVBTLCB1bmRlZmluZWQsIG51bGwsIFtdKVxuICAgICAgICAgIC5yZXR1cm5zKFtTRVNTSU9OX0lELCBCQVNFX0NBUFNdKTtcbiAgICAgICAgYXdhaXQgYXBwaXVtLmNyZWF0ZVNlc3Npb24oQkFTRV9DQVBTKTtcblxuICAgICAgICBzZXNzaW9ucyA9IGF3YWl0IGFwcGl1bS5nZXRTZXNzaW9ucygpO1xuICAgICAgICBzZXNzaW9ucy5zaG91bGQuaGF2ZS5sZW5ndGgoMSk7XG5cbiAgICAgICAgZm9yIChsZXQgbWZkIG9mIG1vY2tGYWtlRHJpdmVycykge1xuICAgICAgICAgIG1mZC52ZXJpZnkoKTtcbiAgICAgICAgfVxuICAgICAgICBtb2NrRmFrZURyaXZlci52ZXJpZnkoKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBjYWxsIFwiY3JlYXRlU2Vzc2lvblwiIHdpdGggVzNDIGNhcGFiaWxpdGllcyBhcmd1bWVudCwgaWYgcHJvdmlkZWQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tGYWtlRHJpdmVyLmV4cGVjdHMoJ2NyZWF0ZVNlc3Npb24nKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEFyZ3MobnVsbCwgdW5kZWZpbmVkLCBXM0NfQ0FQUylcbiAgICAgICAgICAucmV0dXJucyhbU0VTU0lPTl9JRCwgQkFTRV9DQVBTXSk7XG4gICAgICAgIGF3YWl0IGFwcGl1bS5jcmVhdGVTZXNzaW9uKHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBXM0NfQ0FQUyk7XG4gICAgICAgIG1vY2tGYWtlRHJpdmVyLnZlcmlmeSgpO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgXCJjcmVhdGVTZXNzaW9uXCIgd2l0aCBXM0MgY2FwYWJpbGl0aWVzIGFyZ3VtZW50IHdpdGggYWRkaXRpb25hbCBwcm92aWRlZCBwYXJhbWV0ZXJzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgdzNjQ2FwcyA9IHtcbiAgICAgICAgICAuLi5XM0NfQ0FQUyxcbiAgICAgICAgICBhbHdheXNNYXRjaDoge1xuICAgICAgICAgICAgLi4uVzNDX0NBUFMuYWx3YXlzTWF0Y2gsXG4gICAgICAgICAgICAnYXBwaXVtOnNvbWVPdGhlclBhcm0nOiAnc29tZU90aGVyUGFybScsXG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgICAgbW9ja0Zha2VEcml2ZXIuZXhwZWN0cygnY3JlYXRlU2Vzc2lvbicpXG4gICAgICAgICAgLm9uY2UoKS53aXRoQXJncyhudWxsLCB1bmRlZmluZWQsIHtcbiAgICAgICAgICAgIGFsd2F5c01hdGNoOiB7XG4gICAgICAgICAgICAgIC4uLnczY0NhcHMuYWx3YXlzTWF0Y2gsXG4gICAgICAgICAgICAgICdhcHBpdW06c29tZU90aGVyUGFybSc6ICdzb21lT3RoZXJQYXJtJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmaXJzdE1hdGNoOiBbe31dLFxuICAgICAgICAgIH0pXG4gICAgICAgICAgLnJldHVybnMoW1NFU1NJT05fSUQsIGluc2VydEFwcGl1bVByZWZpeGVzKEJBU0VfQ0FQUyldKTtcblxuICAgICAgICBhd2FpdCBhcHBpdW0uY3JlYXRlU2Vzc2lvbih1bmRlZmluZWQsIHVuZGVmaW5lZCwgdzNjQ2Fwcyk7XG4gICAgICAgIG1vY2tGYWtlRHJpdmVyLnZlcmlmeSgpO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgXCJjcmVhdGVTZXNzaW9uXCIgd2l0aCBKU09OV1AgY2FwYWJpbGl0aWVzIGlmIFczQyBoYXMgaW5jb21wbGV0ZSBjYXBhYmlsaXRpZXMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCB3M2NDYXBzID0ge1xuICAgICAgICAgIC4uLlczQ19DQVBTLFxuICAgICAgICAgIGFsd2F5c01hdGNoOiB7XG4gICAgICAgICAgICAuLi5XM0NfQ0FQUy5hbHdheXNNYXRjaCxcbiAgICAgICAgICAgICdhcHBpdW06c29tZU90aGVyUGFybSc6ICdzb21lT3RoZXJQYXJtJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuXG4gICAgICAgIGxldCBqc29ud3BDYXBzID0ge1xuICAgICAgICAgIC4uLkJBU0VfQ0FQUyxcbiAgICAgICAgICBhdXRvbWF0aW9uTmFtZTogJ0Zha2UnLFxuICAgICAgICAgIHNvbWVPdGhlclBhcmFtOiAnc29tZU90aGVyUGFyYW0nLFxuICAgICAgICB9O1xuXG4gICAgICAgIGxldCBleHBlY3RlZFczY0NhcHMgPSB7XG4gICAgICAgICAgLi4udzNjQ2FwcyxcbiAgICAgICAgICBhbHdheXNNYXRjaDoge1xuICAgICAgICAgICAgLi4udzNjQ2Fwcy5hbHdheXNNYXRjaCxcbiAgICAgICAgICAgICdhcHBpdW06YXV0b21hdGlvbk5hbWUnOiAnRmFrZScsXG4gICAgICAgICAgICAnYXBwaXVtOnNvbWVPdGhlclBhcmFtJzogJ3NvbWVPdGhlclBhcmFtJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuXG4gICAgICAgIG1vY2tGYWtlRHJpdmVyLmV4cGVjdHMoJ2NyZWF0ZVNlc3Npb24nKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEFyZ3MoanNvbndwQ2FwcywgdW5kZWZpbmVkLCBleHBlY3RlZFczY0NhcHMpXG4gICAgICAgICAgLnJldHVybnMoW1NFU1NJT05fSUQsIGpzb253cENhcHNdKTtcblxuICAgICAgICBhd2FpdCBhcHBpdW0uY3JlYXRlU2Vzc2lvbihqc29ud3BDYXBzLCB1bmRlZmluZWQsIHczY0NhcHMpO1xuICAgICAgICBtb2NrRmFrZURyaXZlci52ZXJpZnkoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdkZWxldGVTZXNzaW9uJywgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IGFwcGl1bTtcbiAgICAgIGxldCBtb2NrRmFrZURyaXZlcjtcbiAgICAgIGJlZm9yZUVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICBbYXBwaXVtLCBtb2NrRmFrZURyaXZlcl0gPSBnZXREcml2ZXJBbmRGYWtlRHJpdmVyKCk7XG4gICAgICB9KTtcbiAgICAgIGFmdGVyRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tGYWtlRHJpdmVyLnJlc3RvcmUoKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCByZW1vdmUgdGhlIHNlc3Npb24gaWYgaXQgaXMgZm91bmQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCBbc2Vzc2lvbklkXSA9IChhd2FpdCBhcHBpdW0uY3JlYXRlU2Vzc2lvbihCQVNFX0NBUFMpKS52YWx1ZTtcbiAgICAgICAgbGV0IHNlc3Npb25zID0gYXdhaXQgYXBwaXVtLmdldFNlc3Npb25zKCk7XG4gICAgICAgIHNlc3Npb25zLnNob3VsZC5oYXZlLmxlbmd0aCgxKTtcbiAgICAgICAgYXdhaXQgYXBwaXVtLmRlbGV0ZVNlc3Npb24oc2Vzc2lvbklkKTtcbiAgICAgICAgc2Vzc2lvbnMgPSBhd2FpdCBhcHBpdW0uZ2V0U2Vzc2lvbnMoKTtcbiAgICAgICAgc2Vzc2lvbnMuc2hvdWxkLmhhdmUubGVuZ3RoKDApO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgaW5uZXIgZHJpdmVyXFwncyBkZWxldGVTZXNzaW9uIG1ldGhvZCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgW3Nlc3Npb25JZF0gPSAoYXdhaXQgYXBwaXVtLmNyZWF0ZVNlc3Npb24oQkFTRV9DQVBTKSkudmFsdWU7XG4gICAgICAgIG1vY2tGYWtlRHJpdmVyLmV4cGVjdHMoJ2RlbGV0ZVNlc3Npb24nKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhzZXNzaW9uSWQsIFtdKVxuICAgICAgICAgIC5yZXR1cm5zKCk7XG4gICAgICAgIGF3YWl0IGFwcGl1bS5kZWxldGVTZXNzaW9uKHNlc3Npb25JZCk7XG4gICAgICAgIG1vY2tGYWtlRHJpdmVyLnZlcmlmeSgpO1xuXG4gICAgICAgIC8vIGNsZWFudXAsIHNpbmNlIHdlIGZha2VkIHRoZSBkZWxldGUgc2Vzc2lvbiBjYWxsXG4gICAgICAgIGF3YWl0IG1vY2tGYWtlRHJpdmVyLm9iamVjdC5kZWxldGVTZXNzaW9uKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgnZ2V0U2Vzc2lvbnMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgYXBwaXVtO1xuICAgICAgbGV0IHNlc3Npb25zO1xuICAgICAgYmVmb3JlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYXBwaXVtID0gbmV3IEFwcGl1bURyaXZlcih7fSk7XG4gICAgICB9KTtcbiAgICAgIGFmdGVyRWFjaChhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvciAobGV0IHNlc3Npb24gb2Ygc2Vzc2lvbnMpIHtcbiAgICAgICAgICBhd2FpdCBhcHBpdW0uZGVsZXRlU2Vzc2lvbihzZXNzaW9uLmlkKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIHJldHVybiBhbiBlbXB0eSBhcnJheSBvZiBzZXNzaW9ucycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2Vzc2lvbnMgPSBhd2FpdCBhcHBpdW0uZ2V0U2Vzc2lvbnMoKTtcbiAgICAgICAgc2Vzc2lvbnMuc2hvdWxkLmJlLmFuKCdhcnJheScpO1xuICAgICAgICBzZXNzaW9ucy5zaG91bGQuYmUuZW1wdHk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgcmV0dXJuIHNlc3Npb25zIGNyZWF0ZWQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCBzZXNzaW9uMSA9IChhd2FpdCBhcHBpdW0uY3JlYXRlU2Vzc2lvbihfLmV4dGVuZChfLmNsb25lKEJBU0VfQ0FQUyksIHtjYXA6ICd2YWx1ZSd9KSkpLnZhbHVlO1xuICAgICAgICBsZXQgc2Vzc2lvbjIgPSAoYXdhaXQgYXBwaXVtLmNyZWF0ZVNlc3Npb24oXy5leHRlbmQoXy5jbG9uZShCQVNFX0NBUFMpLCB7Y2FwOiAnb3RoZXIgdmFsdWUnfSkpKS52YWx1ZTtcblxuICAgICAgICBzZXNzaW9ucyA9IGF3YWl0IGFwcGl1bS5nZXRTZXNzaW9ucygpO1xuICAgICAgICBzZXNzaW9ucy5zaG91bGQuYmUuYW4oJ2FycmF5Jyk7XG4gICAgICAgIHNlc3Npb25zLnNob3VsZC5oYXZlLmxlbmd0aCgyKTtcbiAgICAgICAgc2Vzc2lvbnNbMF0uaWQuc2hvdWxkLmVxdWFsKHNlc3Npb24xWzBdKTtcbiAgICAgICAgc2Vzc2lvbnNbMF0uY2FwYWJpbGl0aWVzLnNob3VsZC5lcWwoc2Vzc2lvbjFbMV0pO1xuICAgICAgICBzZXNzaW9uc1sxXS5pZC5zaG91bGQuZXF1YWwoc2Vzc2lvbjJbMF0pO1xuICAgICAgICBzZXNzaW9uc1sxXS5jYXBhYmlsaXRpZXMuc2hvdWxkLmVxbChzZXNzaW9uMlsxXSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgnZ2V0U3RhdHVzJywgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IGFwcGl1bTtcbiAgICAgIGJlZm9yZShmdW5jdGlvbiAoKSB7XG4gICAgICAgIGFwcGl1bSA9IG5ldyBBcHBpdW1Ecml2ZXIoe30pO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIHJldHVybiBhIHN0YXR1cycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IHN0YXR1cyA9IGF3YWl0IGFwcGl1bS5nZXRTdGF0dXMoKTtcbiAgICAgICAgc3RhdHVzLmJ1aWxkLnNob3VsZC5leGlzdDtcbiAgICAgICAgc3RhdHVzLmJ1aWxkLnZlcnNpb24uc2hvdWxkLmV4aXN0O1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ3Nlc3Npb25FeGlzdHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ2F0dGFjaFVuZXhwZWN0ZWRTaHV0ZG93bkhhbmRsZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgYXBwaXVtO1xuICAgICAgbGV0IG1vY2tGYWtlRHJpdmVyO1xuICAgICAgYmVmb3JlRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIFthcHBpdW0sIG1vY2tGYWtlRHJpdmVyXSA9IGdldERyaXZlckFuZEZha2VEcml2ZXIoKTtcbiAgICAgIH0pO1xuICAgICAgYWZ0ZXJFYWNoKGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYXdhaXQgbW9ja0Zha2VEcml2ZXIub2JqZWN0LmRlbGV0ZVNlc3Npb24oKTtcbiAgICAgICAgbW9ja0Zha2VEcml2ZXIucmVzdG9yZSgpO1xuICAgICAgICBhcHBpdW0uYXJncy5kZWZhdWx0Q2FwYWJpbGl0aWVzID0ge307XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCByZW1vdmUgc2Vzc2lvbiBpZiBpbm5lciBkcml2ZXIgdW5leHBlY3RlZGx5IGV4aXRzIHdpdGggYW4gZXJyb3InLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCBbc2Vzc2lvbklkLF0gPSAoYXdhaXQgYXBwaXVtLmNyZWF0ZVNlc3Npb24oXy5jbG9uZShCQVNFX0NBUFMpKSkudmFsdWU7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY29tbWEtc3BhY2luZ1xuICAgICAgICBfLmtleXMoYXBwaXVtLnNlc3Npb25zKS5zaG91bGQuY29udGFpbihzZXNzaW9uSWQpO1xuICAgICAgICBhcHBpdW0uc2Vzc2lvbnNbc2Vzc2lvbklkXS5ldmVudEVtaXR0ZXIuZW1pdCgnb25VbmV4cGVjdGVkU2h1dGRvd24nLCBuZXcgRXJyb3IoJ09vcHMnKSk7XG4gICAgICAgIC8vIGxldCBldmVudCBsb29wIHNwaW4gc28gcmVqZWN0aW9uIGlzIGhhbmRsZWRcbiAgICAgICAgYXdhaXQgc2xlZXAoMSk7XG4gICAgICAgIF8ua2V5cyhhcHBpdW0uc2Vzc2lvbnMpLnNob3VsZC5ub3QuY29udGFpbihzZXNzaW9uSWQpO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIHJlbW92ZSBzZXNzaW9uIGlmIGlubmVyIGRyaXZlciB1bmV4cGVjdGVkbHkgZXhpdHMgd2l0aCBubyBlcnJvcicsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IFtzZXNzaW9uSWQsXSA9IChhd2FpdCBhcHBpdW0uY3JlYXRlU2Vzc2lvbihfLmNsb25lKEJBU0VfQ0FQUykpKS52YWx1ZTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjb21tYS1zcGFjaW5nXG4gICAgICAgIF8ua2V5cyhhcHBpdW0uc2Vzc2lvbnMpLnNob3VsZC5jb250YWluKHNlc3Npb25JZCk7XG4gICAgICAgIGFwcGl1bS5zZXNzaW9uc1tzZXNzaW9uSWRdLmV2ZW50RW1pdHRlci5lbWl0KCdvblVuZXhwZWN0ZWRTaHV0ZG93bicpO1xuICAgICAgICAvLyBsZXQgZXZlbnQgbG9vcCBzcGluIHNvIHJlamVjdGlvbiBpcyBoYW5kbGVkXG4gICAgICAgIGF3YWl0IHNsZWVwKDEpO1xuICAgICAgICBfLmtleXMoYXBwaXVtLnNlc3Npb25zKS5zaG91bGQubm90LmNvbnRhaW4oc2Vzc2lvbklkKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdnZXREcml2ZXJBbmRWZXJzaW9uRm9yQ2FwcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgbm90IGJsb3cgdXAgaWYgdXNlciBkb2VzIG5vdCBwcm92aWRlIHBsYXRmb3JtTmFtZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgYXBwaXVtID0gbmV3IEFwcGl1bURyaXZlcih7fSk7XG4gICAgICAgICgoKSA9PiB7IGFwcGl1bS5nZXREcml2ZXJBbmRWZXJzaW9uRm9yQ2Fwcyh7fSk7IH0pLnNob3VsZC50aHJvdygvcGxhdGZvcm1OYW1lLyk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgaWdub3JlIGF1dG9tYXRpb25OYW1lIEFwcGl1bScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgYXBwaXVtID0gbmV3IEFwcGl1bURyaXZlcih7fSk7XG4gICAgICAgIGNvbnN0IHtkcml2ZXJ9ID0gYXBwaXVtLmdldERyaXZlckFuZFZlcnNpb25Gb3JDYXBzKHtcbiAgICAgICAgICBwbGF0Zm9ybU5hbWU6ICdBbmRyb2lkJyxcbiAgICAgICAgICBhdXRvbWF0aW9uTmFtZTogJ0FwcGl1bSdcbiAgICAgICAgfSk7XG4gICAgICAgIGRyaXZlci5zaG91bGQuYmUuYW4uaW5zdGFuY2VvZihGdW5jdGlvbik7XG4gICAgICAgIGRyaXZlci5zaG91bGQuZXF1YWwoQW5kcm9pZFVpYXV0b21hdG9yMkRyaXZlcik7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgZ2V0IFhDVUlUZXN0RHJpdmVyIGRyaXZlciBmb3IgYXV0b21hdGlvbk5hbWUgb2YgWENVSVRlc3QnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IGFwcGl1bSA9IG5ldyBBcHBpdW1Ecml2ZXIoe30pO1xuICAgICAgICBjb25zdCB7ZHJpdmVyfSA9IGFwcGl1bS5nZXREcml2ZXJBbmRWZXJzaW9uRm9yQ2Fwcyh7XG4gICAgICAgICAgcGxhdGZvcm1OYW1lOiAnaU9TJyxcbiAgICAgICAgICBhdXRvbWF0aW9uTmFtZTogJ1hDVUlUZXN0J1xuICAgICAgICB9KTtcbiAgICAgICAgZHJpdmVyLnNob3VsZC5iZS5hbi5pbnN0YW5jZW9mKEZ1bmN0aW9uKTtcbiAgICAgICAgZHJpdmVyLnNob3VsZC5lcXVhbChYQ1VJVGVzdERyaXZlcik7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgZ2V0IGlvc2RyaXZlciBmb3IgaW9zIDwgMTAnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IGFwcGl1bSA9IG5ldyBBcHBpdW1Ecml2ZXIoe30pO1xuICAgICAgICBjb25zdCBjYXBzID0ge1xuICAgICAgICAgIHBsYXRmb3JtTmFtZTogJ2lPUycsXG4gICAgICAgICAgcGxhdGZvcm1WZXJzaW9uOiAnOC4wJyxcbiAgICAgICAgfTtcbiAgICAgICAgbGV0IHtkcml2ZXJ9ID0gYXBwaXVtLmdldERyaXZlckFuZFZlcnNpb25Gb3JDYXBzKGNhcHMpO1xuICAgICAgICBkcml2ZXIuc2hvdWxkLmJlLmFuLmluc3RhbmNlb2YoRnVuY3Rpb24pO1xuICAgICAgICBkcml2ZXIuc2hvdWxkLmVxdWFsKElvc0RyaXZlcik7XG5cbiAgICAgICAgY2Fwcy5wbGF0Zm9ybVZlcnNpb24gPSAnOC4xJztcbiAgICAgICAgKHtkcml2ZXJ9ID0gYXBwaXVtLmdldERyaXZlckFuZFZlcnNpb25Gb3JDYXBzKGNhcHMpKTtcbiAgICAgICAgZHJpdmVyLnNob3VsZC5lcXVhbChJb3NEcml2ZXIpO1xuXG4gICAgICAgIGNhcHMucGxhdGZvcm1WZXJzaW9uID0gJzkuNCc7XG4gICAgICAgICh7ZHJpdmVyfSA9IGFwcGl1bS5nZXREcml2ZXJBbmRWZXJzaW9uRm9yQ2FwcyhjYXBzKSk7XG4gICAgICAgIGRyaXZlci5zaG91bGQuZXF1YWwoSW9zRHJpdmVyKTtcblxuICAgICAgICBjYXBzLnBsYXRmb3JtVmVyc2lvbiA9ICcnO1xuICAgICAgICAoe2RyaXZlcn0gPSBhcHBpdW0uZ2V0RHJpdmVyQW5kVmVyc2lvbkZvckNhcHMoY2FwcykpO1xuICAgICAgICBkcml2ZXIuc2hvdWxkLmVxdWFsKElvc0RyaXZlcik7XG5cbiAgICAgICAgY2Fwcy5wbGF0Zm9ybVZlcnNpb24gPSAnZm9vJztcbiAgICAgICAgKHtkcml2ZXJ9ID0gYXBwaXVtLmdldERyaXZlckFuZFZlcnNpb25Gb3JDYXBzKGNhcHMpKTtcbiAgICAgICAgZHJpdmVyLnNob3VsZC5lcXVhbChJb3NEcml2ZXIpO1xuXG4gICAgICAgIGRlbGV0ZSBjYXBzLnBsYXRmb3JtVmVyc2lvbjtcbiAgICAgICAgKHtkcml2ZXJ9ID0gYXBwaXVtLmdldERyaXZlckFuZFZlcnNpb25Gb3JDYXBzKGNhcHMpKTtcbiAgICAgICAgZHJpdmVyLnNob3VsZC5lcXVhbChJb3NEcml2ZXIpO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGdldCB4Y3VpdGVzdGRyaXZlciBmb3IgaW9zID49IDEwJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCBhcHBpdW0gPSBuZXcgQXBwaXVtRHJpdmVyKHt9KTtcbiAgICAgICAgY29uc3QgY2FwcyA9IHtcbiAgICAgICAgICBwbGF0Zm9ybU5hbWU6ICdpT1MnLFxuICAgICAgICAgIHBsYXRmb3JtVmVyc2lvbjogJzEwJyxcbiAgICAgICAgfTtcbiAgICAgICAgbGV0IHtkcml2ZXJ9ID0gYXBwaXVtLmdldERyaXZlckFuZFZlcnNpb25Gb3JDYXBzKGNhcHMpO1xuICAgICAgICBkcml2ZXIuc2hvdWxkLmJlLmFuLmluc3RhbmNlb2YoRnVuY3Rpb24pO1xuICAgICAgICBkcml2ZXIuc2hvdWxkLmVxdWFsKFhDVUlUZXN0RHJpdmVyKTtcblxuICAgICAgICBjYXBzLnBsYXRmb3JtVmVyc2lvbiA9ICcxMC4wJztcbiAgICAgICAgKHtkcml2ZXJ9ID0gYXBwaXVtLmdldERyaXZlckFuZFZlcnNpb25Gb3JDYXBzKGNhcHMpKTtcbiAgICAgICAgZHJpdmVyLnNob3VsZC5lcXVhbChYQ1VJVGVzdERyaXZlcik7XG5cbiAgICAgICAgY2Fwcy5wbGF0Zm9ybVZlcnNpb24gPSAnMTAuMSc7XG4gICAgICAgICh7ZHJpdmVyfSA9IGFwcGl1bS5nZXREcml2ZXJBbmRWZXJzaW9uRm9yQ2FwcyhjYXBzKSk7XG4gICAgICAgIGRyaXZlci5zaG91bGQuZXF1YWwoWENVSVRlc3REcml2ZXIpO1xuXG4gICAgICAgIGNhcHMucGxhdGZvcm1WZXJzaW9uID0gJzEyLjE0JztcbiAgICAgICAgKHtkcml2ZXJ9ID0gYXBwaXVtLmdldERyaXZlckFuZFZlcnNpb25Gb3JDYXBzKGNhcHMpKTtcbiAgICAgICAgZHJpdmVyLnNob3VsZC5lcXVhbChYQ1VJVGVzdERyaXZlcik7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgYmUgYWJsZSB0byBoYW5kbGUgZGlmZmVyZW50IGNhc2VzIGluIGF1dG9tYXRpb25OYW1lJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCBhcHBpdW0gPSBuZXcgQXBwaXVtRHJpdmVyKHt9KTtcbiAgICAgICAgY29uc3QgY2FwcyA9IHtcbiAgICAgICAgICBwbGF0Zm9ybU5hbWU6ICdpT1MnLFxuICAgICAgICAgIHBsYXRmb3JtVmVyc2lvbjogJzEwJyxcbiAgICAgICAgICBhdXRvbWF0aW9uTmFtZTogJ1hjVWlUZVN0JyxcbiAgICAgICAgfTtcbiAgICAgICAgbGV0IHtkcml2ZXJ9ID0gYXBwaXVtLmdldERyaXZlckFuZFZlcnNpb25Gb3JDYXBzKGNhcHMpO1xuICAgICAgICBkcml2ZXIuc2hvdWxkLmJlLmFuLmluc3RhbmNlb2YoRnVuY3Rpb24pO1xuICAgICAgICBkcml2ZXIuc2hvdWxkLmVxdWFsKFhDVUlUZXN0RHJpdmVyKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBiZSBhYmxlIHRvIGhhbmRsZSBkaWZmZXJlbnQgY2FzZSBpbiBwbGF0Zm9ybU5hbWUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IGFwcGl1bSA9IG5ldyBBcHBpdW1Ecml2ZXIoe30pO1xuICAgICAgICBjb25zdCBjYXBzID0ge1xuICAgICAgICAgIHBsYXRmb3JtTmFtZTogJ0lvUycsXG4gICAgICAgICAgcGxhdGZvcm1WZXJzaW9uOiAnMTAnLFxuICAgICAgICB9O1xuICAgICAgICBsZXQge2RyaXZlcn0gPSBhcHBpdW0uZ2V0RHJpdmVyQW5kVmVyc2lvbkZvckNhcHMoY2Fwcyk7XG4gICAgICAgIGRyaXZlci5zaG91bGQuYmUuYW4uaW5zdGFuY2VvZihGdW5jdGlvbik7XG4gICAgICAgIGRyaXZlci5zaG91bGQuZXF1YWwoWENVSVRlc3REcml2ZXIpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXSwiZmlsZSI6InRlc3QvZHJpdmVyLXNwZWNzLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uIn0=
