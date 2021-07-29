import path from 'path';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {logger} from '@appium/support';
import {readConfigFile} from '../lib/config-file';

chai.use(chaiAsPromised);
chai.should();

describe('config file behavior', function () {

  const FIXTURE_PATH = path.join(__dirname, './fixtures/config');

  const GOOD_FILEPATH = path.join(FIXTURE_PATH, 'appium.config.good.json');
  const NODECONFIG_FILEPATH = path.join(
    FIXTURE_PATH,
    'appium.config.nodeconfig-path.json',
  );
  const BAD_FILEPATH = path.join(FIXTURE_PATH, 'appium.config.bad.json');
  const INVALID_JSON_FILEPATH = path.join(
    FIXTURE_PATH,
    'appium.config.invalid.json',
  );
  const SECURITY_ARRAY_FILEPATH = path.join(
    FIXTURE_PATH,
    'appium.config.security-array.json',
  );
  const SECURITY_DELIMITED_FILEPATH = path.join(
    FIXTURE_PATH,
    'appium.config.security-delimited.json',
  );
  const SECURITY_PATH_FILEPATH = path.join(
    FIXTURE_PATH,
    'appium.config.security-path.json',
  );

  let oldLogLevel;
  before(function () {
    // canonical way to do this?
    oldLogLevel = logger.getLogger('Appium').level;
    logger.getLogger('Appium').level = 'error';
  });

  after(function () {
    logger.getLogger('Appium').level = oldLogLevel;
  });

  describe('when provided a path to a config file', function () {
    describe('when the config file is valid per the schema', function () {
      it('should return a valid config object', async function () {
        const result = await readConfigFile(GOOD_FILEPATH, {
          normalize: false,
        });
        result.should.deep.equal({
          config: require(GOOD_FILEPATH),
          filepath: GOOD_FILEPATH,
          errors: [],
        });
      });

      describe('server.nodeconfig behavior', function () {
        describe('when a string', function () {
          it('should return a valid config object', async function () {
            const result = await readConfigFile(NODECONFIG_FILEPATH, {
              normalize: false,
            });
            result.should.deep.equal({
              config: require(NODECONFIG_FILEPATH),
              filepath: NODECONFIG_FILEPATH,
              errors: [],
            });
          });
        });
      });

      describe('server.allow-insecure behavior', function () {
        describe('when a string path', function () {
          it('should return a valid config object', async function () {
            const result = await readConfigFile(SECURITY_PATH_FILEPATH, {
              normalize: false,
            });
            result.should.deep.equal({
              config: require(SECURITY_PATH_FILEPATH),
              filepath: SECURITY_PATH_FILEPATH,
              errors: [],
            });
          });
        });

        describe('when a comma-delimited string', function () {
          it('should return a valid config object', async function () {
            const result = await readConfigFile(SECURITY_DELIMITED_FILEPATH, {
              normalize: false,
            });
            result.should.deep.equal({
              config: require(SECURITY_DELIMITED_FILEPATH),
              filepath: SECURITY_DELIMITED_FILEPATH,
              errors: [],
            });
          });
        });

        describe('when an array', function () {
          it('should return a valid config object', async function () {
            const result = await readConfigFile(SECURITY_ARRAY_FILEPATH, {
              normalize: false,
            });
            result.should.deep.equal({
              config: require(SECURITY_ARRAY_FILEPATH),
              filepath: SECURITY_ARRAY_FILEPATH,
              errors: [],
            });
          });
        });
      });
    });

    describe('when the config file is invalid per the schema', function () {
      it('should return an object containing errors', async function () {
        const result = await readConfigFile(BAD_FILEPATH, {
          normalize: false,
        });
        result.should.have.deep.property('config', require(BAD_FILEPATH));
        result.should.have.property('filepath', BAD_FILEPATH);
        result.should.have.deep.property('errors', [
          {
            instancePath: '/server/allow-cors',
            schemaPath: '#/properties/server/properties/allow-cors/type',
            keyword: 'type',
            params: {type: 'boolean'},
            message: 'must be boolean',
          },
          {
            instancePath: '/server/port',
            schemaPath: '#/properties/server/properties/port/type',
            keyword: 'type',
            params: {type: 'integer'},
            message: 'must be integer',
          },
          {
            instancePath: '/server/callback-port',
            schemaPath: '#/properties/server/properties/callback-port/maximum',
            keyword: 'maximum',
            params: {comparison: '<=', limit: 65535},
            message: 'must be <= 65535',
          },
          {
            instancePath: '/server/log-level',
            schemaPath: '#/properties/server/properties/log-level/enum',
            keyword: 'enum',
            params: {
              allowedValues: [
                'info',
                'info:debug',
                'info:info',
                'info:warn',
                'info:error',
                'warn',
                'warn:debug',
                'warn:info',
                'warn:warn',
                'warn:error',
                'error',
                'error:debug',
                'error:info',
                'error:warn',
                'error:error',
                'debug',
                'debug:debug',
                'debug:info',
                'debug:warn',
                'debug:error',
              ],
            },
            message: 'must be equal to one of the allowed values',
          },
          {
            instancePath: '/server/log-no-colors',
            schemaPath: '#/properties/server/properties/log-no-colors/type',
            keyword: 'type',
            params: {type: 'boolean'},
            message: 'must be boolean',
          },
          {
            instancePath: '/server/allow-insecure',
            schemaPath: '#/properties/server/properties/allow-insecure/type',
            keyword: 'type',
            params: {type: ['array', 'string']},
            message: 'must be array,string',
          },
        ]);

        result.should.have.property('reason').that.is.a.string;
      });
    });

    describe('when the config file is invalid JSON', function () {
      it('should reject with a user-friendly error message', async function () {
        await readConfigFile(INVALID_JSON_FILEPATH).should.be.rejectedWith(
          new RegExp(`${INVALID_JSON_FILEPATH} is invalid`),
        );
      });
    });
  });
});
