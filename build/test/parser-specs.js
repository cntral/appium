"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

require("source-map-support/register");

var _parser = _interopRequireDefault(require("../lib/parser"));

var _chai = _interopRequireDefault(require("chai"));

const should = _chai.default.should();

const ALLOW_FIXTURE = 'test/fixtures/allow-feat.txt';
const DENY_FIXTURE = 'test/fixtures/deny-feat.txt';
describe('Parser', function () {
  let p = (0, _parser.default)();
  p.debug = true;
  it('should return an arg parser', function () {
    should.exist(p.parse_args);
    p.parse_args([]).should.have.property('port');
  });
  it('should keep the raw server flags array', function () {
    should.exist(p.rawArgs);
  });
  it('should have help for every arg', function () {
    for (let arg of p.rawArgs) {
      arg[1].should.have.property('help');
    }
  });
  it('should throw an error with unknown argument', function () {
    (() => {
      p.parse_args(['--apple']);
    }).should.throw();
  });
  it('should parse default capabilities correctly from a string', function () {
    let defaultCapabilities = {
      a: 'b'
    };
    let args = p.parse_args(['--default-capabilities', JSON.stringify(defaultCapabilities)]);
    args.defaultCapabilities.should.eql(defaultCapabilities);
  });
  it('should parse default capabilities correctly from a file', function () {
    let defaultCapabilities = {
      a: 'b'
    };
    let args = p.parse_args(['--default-capabilities', 'test/fixtures/caps.json']);
    args.defaultCapabilities.should.eql(defaultCapabilities);
  });
  it('should throw an error with invalid arg to default capabilities', function () {
    (() => {
      p.parse_args(['-dc', '42']);
    }).should.throw();
    (() => {
      p.parse_args(['-dc', 'false']);
    }).should.throw();
    (() => {
      p.parse_args(['-dc', 'null']);
    }).should.throw();
    (() => {
      p.parse_args(['-dc', 'does/not/exist.json']);
    }).should.throw();
  });
  it('should parse args that are caps into default capabilities', function () {
    let defaultCapabilities = {
      localizableStringsDir: '/my/dir'
    };
    let args = p.parse_args(['--localizable-strings-dir', '/my/dir']);
    args.defaultCapabilities.should.eql(defaultCapabilities);
  });
  it('should parse --allow-insecure correctly', function () {
    p.parse_args([]).allowInsecure.should.eql([]);
    p.parse_args(['--allow-insecure', '']).allowInsecure.should.eql([]);
    p.parse_args(['--allow-insecure', 'foo']).allowInsecure.should.eql(['foo']);
    p.parse_args(['--allow-insecure', 'foo,bar']).allowInsecure.should.eql(['foo', 'bar']);
    p.parse_args(['--allow-insecure', 'foo ,bar']).allowInsecure.should.eql(['foo', 'bar']);
  });
  it('should parse --deny-insecure correctly', function () {
    p.parse_args([]).denyInsecure.should.eql([]);
    p.parse_args(['--deny-insecure', '']).denyInsecure.should.eql([]);
    p.parse_args(['--deny-insecure', 'foo']).denyInsecure.should.eql(['foo']);
    p.parse_args(['--deny-insecure', 'foo,bar']).denyInsecure.should.eql(['foo', 'bar']);
    p.parse_args(['--deny-insecure', 'foo ,bar']).denyInsecure.should.eql(['foo', 'bar']);
  });
  it('should parse --allow and --deny insecure from files', function () {
    const parsed = p.parse_args(['--allow-insecure', ALLOW_FIXTURE, '--deny-insecure', DENY_FIXTURE]);
    parsed.allowInsecure.should.eql(['feature1', 'feature2', 'feature3']);
    parsed.denyInsecure.should.eql(['nofeature1', 'nofeature2', 'nofeature3']);
  });
});require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvcGFyc2VyLXNwZWNzLmpzIl0sIm5hbWVzIjpbInNob3VsZCIsImNoYWkiLCJBTExPV19GSVhUVVJFIiwiREVOWV9GSVhUVVJFIiwiZGVzY3JpYmUiLCJwIiwiZGVidWciLCJpdCIsImV4aXN0IiwicGFyc2VfYXJncyIsImhhdmUiLCJwcm9wZXJ0eSIsInJhd0FyZ3MiLCJhcmciLCJ0aHJvdyIsImRlZmF1bHRDYXBhYmlsaXRpZXMiLCJhIiwiYXJncyIsIkpTT04iLCJzdHJpbmdpZnkiLCJlcWwiLCJsb2NhbGl6YWJsZVN0cmluZ3NEaXIiLCJhbGxvd0luc2VjdXJlIiwiZGVueUluc2VjdXJlIiwicGFyc2VkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFFQTs7QUFDQTs7QUFFQSxNQUFNQSxNQUFNLEdBQUdDLGNBQUtELE1BQUwsRUFBZjs7QUFFQSxNQUFNRSxhQUFhLEdBQUcsOEJBQXRCO0FBQ0EsTUFBTUMsWUFBWSxHQUFHLDZCQUFyQjtBQUVBQyxRQUFRLENBQUMsUUFBRCxFQUFXLFlBQVk7QUFDN0IsTUFBSUMsQ0FBQyxHQUFHLHNCQUFSO0FBQ0FBLEVBQUFBLENBQUMsQ0FBQ0MsS0FBRixHQUFVLElBQVY7QUFDQUMsRUFBQUEsRUFBRSxDQUFDLDZCQUFELEVBQWdDLFlBQVk7QUFDNUNQLElBQUFBLE1BQU0sQ0FBQ1EsS0FBUCxDQUFhSCxDQUFDLENBQUNJLFVBQWY7QUFDQUosSUFBQUEsQ0FBQyxDQUFDSSxVQUFGLENBQWEsRUFBYixFQUFpQlQsTUFBakIsQ0FBd0JVLElBQXhCLENBQTZCQyxRQUE3QixDQUFzQyxNQUF0QztBQUNELEdBSEMsQ0FBRjtBQUlBSixFQUFBQSxFQUFFLENBQUMsd0NBQUQsRUFBMkMsWUFBWTtBQUN2RFAsSUFBQUEsTUFBTSxDQUFDUSxLQUFQLENBQWFILENBQUMsQ0FBQ08sT0FBZjtBQUNELEdBRkMsQ0FBRjtBQUdBTCxFQUFBQSxFQUFFLENBQUMsZ0NBQUQsRUFBbUMsWUFBWTtBQUMvQyxTQUFLLElBQUlNLEdBQVQsSUFBZ0JSLENBQUMsQ0FBQ08sT0FBbEIsRUFBMkI7QUFDekJDLE1BQUFBLEdBQUcsQ0FBQyxDQUFELENBQUgsQ0FBT2IsTUFBUCxDQUFjVSxJQUFkLENBQW1CQyxRQUFuQixDQUE0QixNQUE1QjtBQUNEO0FBQ0YsR0FKQyxDQUFGO0FBS0FKLEVBQUFBLEVBQUUsQ0FBQyw2Q0FBRCxFQUFnRCxZQUFZO0FBQzVELEtBQUMsTUFBTTtBQUFDRixNQUFBQSxDQUFDLENBQUNJLFVBQUYsQ0FBYSxDQUFDLFNBQUQsQ0FBYjtBQUEyQixLQUFuQyxFQUFxQ1QsTUFBckMsQ0FBNENjLEtBQTVDO0FBQ0QsR0FGQyxDQUFGO0FBR0FQLEVBQUFBLEVBQUUsQ0FBQywyREFBRCxFQUE4RCxZQUFZO0FBQzFFLFFBQUlRLG1CQUFtQixHQUFHO0FBQUNDLE1BQUFBLENBQUMsRUFBRTtBQUFKLEtBQTFCO0FBQ0EsUUFBSUMsSUFBSSxHQUFHWixDQUFDLENBQUNJLFVBQUYsQ0FBYSxDQUFDLHdCQUFELEVBQTJCUyxJQUFJLENBQUNDLFNBQUwsQ0FBZUosbUJBQWYsQ0FBM0IsQ0FBYixDQUFYO0FBQ0FFLElBQUFBLElBQUksQ0FBQ0YsbUJBQUwsQ0FBeUJmLE1BQXpCLENBQWdDb0IsR0FBaEMsQ0FBb0NMLG1CQUFwQztBQUNELEdBSkMsQ0FBRjtBQUtBUixFQUFBQSxFQUFFLENBQUMseURBQUQsRUFBNEQsWUFBWTtBQUN4RSxRQUFJUSxtQkFBbUIsR0FBRztBQUFDQyxNQUFBQSxDQUFDLEVBQUU7QUFBSixLQUExQjtBQUNBLFFBQUlDLElBQUksR0FBR1osQ0FBQyxDQUFDSSxVQUFGLENBQWEsQ0FBQyx3QkFBRCxFQUEyQix5QkFBM0IsQ0FBYixDQUFYO0FBQ0FRLElBQUFBLElBQUksQ0FBQ0YsbUJBQUwsQ0FBeUJmLE1BQXpCLENBQWdDb0IsR0FBaEMsQ0FBb0NMLG1CQUFwQztBQUNELEdBSkMsQ0FBRjtBQUtBUixFQUFBQSxFQUFFLENBQUMsZ0VBQUQsRUFBbUUsWUFBWTtBQUMvRSxLQUFDLE1BQU07QUFBQ0YsTUFBQUEsQ0FBQyxDQUFDSSxVQUFGLENBQWEsQ0FBQyxLQUFELEVBQVEsSUFBUixDQUFiO0FBQTZCLEtBQXJDLEVBQXVDVCxNQUF2QyxDQUE4Q2MsS0FBOUM7QUFDQSxLQUFDLE1BQU07QUFBQ1QsTUFBQUEsQ0FBQyxDQUFDSSxVQUFGLENBQWEsQ0FBQyxLQUFELEVBQVEsT0FBUixDQUFiO0FBQWdDLEtBQXhDLEVBQTBDVCxNQUExQyxDQUFpRGMsS0FBakQ7QUFDQSxLQUFDLE1BQU07QUFBQ1QsTUFBQUEsQ0FBQyxDQUFDSSxVQUFGLENBQWEsQ0FBQyxLQUFELEVBQVEsTUFBUixDQUFiO0FBQStCLEtBQXZDLEVBQXlDVCxNQUF6QyxDQUFnRGMsS0FBaEQ7QUFDQSxLQUFDLE1BQU07QUFBQ1QsTUFBQUEsQ0FBQyxDQUFDSSxVQUFGLENBQWEsQ0FBQyxLQUFELEVBQVEscUJBQVIsQ0FBYjtBQUE4QyxLQUF0RCxFQUF3RFQsTUFBeEQsQ0FBK0RjLEtBQS9EO0FBQ0QsR0FMQyxDQUFGO0FBTUFQLEVBQUFBLEVBQUUsQ0FBQywyREFBRCxFQUE4RCxZQUFZO0FBQzFFLFFBQUlRLG1CQUFtQixHQUFHO0FBQUNNLE1BQUFBLHFCQUFxQixFQUFFO0FBQXhCLEtBQTFCO0FBQ0EsUUFBSUosSUFBSSxHQUFHWixDQUFDLENBQUNJLFVBQUYsQ0FBYSxDQUFDLDJCQUFELEVBQThCLFNBQTlCLENBQWIsQ0FBWDtBQUNBUSxJQUFBQSxJQUFJLENBQUNGLG1CQUFMLENBQXlCZixNQUF6QixDQUFnQ29CLEdBQWhDLENBQW9DTCxtQkFBcEM7QUFDRCxHQUpDLENBQUY7QUFLQVIsRUFBQUEsRUFBRSxDQUFDLHlDQUFELEVBQTRDLFlBQVk7QUFDeERGLElBQUFBLENBQUMsQ0FBQ0ksVUFBRixDQUFhLEVBQWIsRUFBaUJhLGFBQWpCLENBQStCdEIsTUFBL0IsQ0FBc0NvQixHQUF0QyxDQUEwQyxFQUExQztBQUNBZixJQUFBQSxDQUFDLENBQUNJLFVBQUYsQ0FBYSxDQUFDLGtCQUFELEVBQXFCLEVBQXJCLENBQWIsRUFBdUNhLGFBQXZDLENBQXFEdEIsTUFBckQsQ0FBNERvQixHQUE1RCxDQUFnRSxFQUFoRTtBQUNBZixJQUFBQSxDQUFDLENBQUNJLFVBQUYsQ0FBYSxDQUFDLGtCQUFELEVBQXFCLEtBQXJCLENBQWIsRUFBMENhLGFBQTFDLENBQXdEdEIsTUFBeEQsQ0FBK0RvQixHQUEvRCxDQUFtRSxDQUFDLEtBQUQsQ0FBbkU7QUFDQWYsSUFBQUEsQ0FBQyxDQUFDSSxVQUFGLENBQWEsQ0FBQyxrQkFBRCxFQUFxQixTQUFyQixDQUFiLEVBQThDYSxhQUE5QyxDQUE0RHRCLE1BQTVELENBQW1Fb0IsR0FBbkUsQ0FBdUUsQ0FBQyxLQUFELEVBQVEsS0FBUixDQUF2RTtBQUNBZixJQUFBQSxDQUFDLENBQUNJLFVBQUYsQ0FBYSxDQUFDLGtCQUFELEVBQXFCLFVBQXJCLENBQWIsRUFBK0NhLGFBQS9DLENBQTZEdEIsTUFBN0QsQ0FBb0VvQixHQUFwRSxDQUF3RSxDQUFDLEtBQUQsRUFBUSxLQUFSLENBQXhFO0FBQ0QsR0FOQyxDQUFGO0FBT0FiLEVBQUFBLEVBQUUsQ0FBQyx3Q0FBRCxFQUEyQyxZQUFZO0FBQ3ZERixJQUFBQSxDQUFDLENBQUNJLFVBQUYsQ0FBYSxFQUFiLEVBQWlCYyxZQUFqQixDQUE4QnZCLE1BQTlCLENBQXFDb0IsR0FBckMsQ0FBeUMsRUFBekM7QUFDQWYsSUFBQUEsQ0FBQyxDQUFDSSxVQUFGLENBQWEsQ0FBQyxpQkFBRCxFQUFvQixFQUFwQixDQUFiLEVBQXNDYyxZQUF0QyxDQUFtRHZCLE1BQW5ELENBQTBEb0IsR0FBMUQsQ0FBOEQsRUFBOUQ7QUFDQWYsSUFBQUEsQ0FBQyxDQUFDSSxVQUFGLENBQWEsQ0FBQyxpQkFBRCxFQUFvQixLQUFwQixDQUFiLEVBQXlDYyxZQUF6QyxDQUFzRHZCLE1BQXRELENBQTZEb0IsR0FBN0QsQ0FBaUUsQ0FBQyxLQUFELENBQWpFO0FBQ0FmLElBQUFBLENBQUMsQ0FBQ0ksVUFBRixDQUFhLENBQUMsaUJBQUQsRUFBb0IsU0FBcEIsQ0FBYixFQUE2Q2MsWUFBN0MsQ0FBMER2QixNQUExRCxDQUFpRW9CLEdBQWpFLENBQXFFLENBQUMsS0FBRCxFQUFRLEtBQVIsQ0FBckU7QUFDQWYsSUFBQUEsQ0FBQyxDQUFDSSxVQUFGLENBQWEsQ0FBQyxpQkFBRCxFQUFvQixVQUFwQixDQUFiLEVBQThDYyxZQUE5QyxDQUEyRHZCLE1BQTNELENBQWtFb0IsR0FBbEUsQ0FBc0UsQ0FBQyxLQUFELEVBQVEsS0FBUixDQUF0RTtBQUNELEdBTkMsQ0FBRjtBQU9BYixFQUFBQSxFQUFFLENBQUMscURBQUQsRUFBd0QsWUFBWTtBQUNwRSxVQUFNaUIsTUFBTSxHQUFHbkIsQ0FBQyxDQUFDSSxVQUFGLENBQWEsQ0FDMUIsa0JBRDBCLEVBQ05QLGFBRE0sRUFDUyxpQkFEVCxFQUM0QkMsWUFENUIsQ0FBYixDQUFmO0FBR0FxQixJQUFBQSxNQUFNLENBQUNGLGFBQVAsQ0FBcUJ0QixNQUFyQixDQUE0Qm9CLEdBQTVCLENBQWdDLENBQUMsVUFBRCxFQUFhLFVBQWIsRUFBeUIsVUFBekIsQ0FBaEM7QUFDQUksSUFBQUEsTUFBTSxDQUFDRCxZQUFQLENBQW9CdkIsTUFBcEIsQ0FBMkJvQixHQUEzQixDQUErQixDQUFDLFlBQUQsRUFBZSxZQUFmLEVBQTZCLFlBQTdCLENBQS9CO0FBQ0QsR0FOQyxDQUFGO0FBT0QsQ0E1RE8sQ0FBUiIsInNvdXJjZXNDb250ZW50IjpbIi8vIHRyYW5zcGlsZTptb2NoYVxuXG5pbXBvcnQgZ2V0UGFyc2VyIGZyb20gJy4uL2xpYi9wYXJzZXInO1xuaW1wb3J0IGNoYWkgZnJvbSAnY2hhaSc7XG5cbmNvbnN0IHNob3VsZCA9IGNoYWkuc2hvdWxkKCk7XG5cbmNvbnN0IEFMTE9XX0ZJWFRVUkUgPSAndGVzdC9maXh0dXJlcy9hbGxvdy1mZWF0LnR4dCc7XG5jb25zdCBERU5ZX0ZJWFRVUkUgPSAndGVzdC9maXh0dXJlcy9kZW55LWZlYXQudHh0JztcblxuZGVzY3JpYmUoJ1BhcnNlcicsIGZ1bmN0aW9uICgpIHtcbiAgbGV0IHAgPSBnZXRQYXJzZXIoKTtcbiAgcC5kZWJ1ZyA9IHRydWU7IC8vIHRocm93IGluc3RlYWQgb2YgZXhpdCBvbiBlcnJvcjsgcGFzcyBhcyBvcHRpb24gaW5zdGVhZD9cbiAgaXQoJ3Nob3VsZCByZXR1cm4gYW4gYXJnIHBhcnNlcicsIGZ1bmN0aW9uICgpIHtcbiAgICBzaG91bGQuZXhpc3QocC5wYXJzZV9hcmdzKTtcbiAgICBwLnBhcnNlX2FyZ3MoW10pLnNob3VsZC5oYXZlLnByb3BlcnR5KCdwb3J0Jyk7XG4gIH0pO1xuICBpdCgnc2hvdWxkIGtlZXAgdGhlIHJhdyBzZXJ2ZXIgZmxhZ3MgYXJyYXknLCBmdW5jdGlvbiAoKSB7XG4gICAgc2hvdWxkLmV4aXN0KHAucmF3QXJncyk7XG4gIH0pO1xuICBpdCgnc2hvdWxkIGhhdmUgaGVscCBmb3IgZXZlcnkgYXJnJywgZnVuY3Rpb24gKCkge1xuICAgIGZvciAobGV0IGFyZyBvZiBwLnJhd0FyZ3MpIHtcbiAgICAgIGFyZ1sxXS5zaG91bGQuaGF2ZS5wcm9wZXJ0eSgnaGVscCcpO1xuICAgIH1cbiAgfSk7XG4gIGl0KCdzaG91bGQgdGhyb3cgYW4gZXJyb3Igd2l0aCB1bmtub3duIGFyZ3VtZW50JywgZnVuY3Rpb24gKCkge1xuICAgICgoKSA9PiB7cC5wYXJzZV9hcmdzKFsnLS1hcHBsZSddKTt9KS5zaG91bGQudGhyb3coKTtcbiAgfSk7XG4gIGl0KCdzaG91bGQgcGFyc2UgZGVmYXVsdCBjYXBhYmlsaXRpZXMgY29ycmVjdGx5IGZyb20gYSBzdHJpbmcnLCBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IGRlZmF1bHRDYXBhYmlsaXRpZXMgPSB7YTogJ2InfTtcbiAgICBsZXQgYXJncyA9IHAucGFyc2VfYXJncyhbJy0tZGVmYXVsdC1jYXBhYmlsaXRpZXMnLCBKU09OLnN0cmluZ2lmeShkZWZhdWx0Q2FwYWJpbGl0aWVzKV0pO1xuICAgIGFyZ3MuZGVmYXVsdENhcGFiaWxpdGllcy5zaG91bGQuZXFsKGRlZmF1bHRDYXBhYmlsaXRpZXMpO1xuICB9KTtcbiAgaXQoJ3Nob3VsZCBwYXJzZSBkZWZhdWx0IGNhcGFiaWxpdGllcyBjb3JyZWN0bHkgZnJvbSBhIGZpbGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IGRlZmF1bHRDYXBhYmlsaXRpZXMgPSB7YTogJ2InfTtcbiAgICBsZXQgYXJncyA9IHAucGFyc2VfYXJncyhbJy0tZGVmYXVsdC1jYXBhYmlsaXRpZXMnLCAndGVzdC9maXh0dXJlcy9jYXBzLmpzb24nXSk7XG4gICAgYXJncy5kZWZhdWx0Q2FwYWJpbGl0aWVzLnNob3VsZC5lcWwoZGVmYXVsdENhcGFiaWxpdGllcyk7XG4gIH0pO1xuICBpdCgnc2hvdWxkIHRocm93IGFuIGVycm9yIHdpdGggaW52YWxpZCBhcmcgdG8gZGVmYXVsdCBjYXBhYmlsaXRpZXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgKCgpID0+IHtwLnBhcnNlX2FyZ3MoWyctZGMnLCAnNDInXSk7fSkuc2hvdWxkLnRocm93KCk7XG4gICAgKCgpID0+IHtwLnBhcnNlX2FyZ3MoWyctZGMnLCAnZmFsc2UnXSk7fSkuc2hvdWxkLnRocm93KCk7XG4gICAgKCgpID0+IHtwLnBhcnNlX2FyZ3MoWyctZGMnLCAnbnVsbCddKTt9KS5zaG91bGQudGhyb3coKTtcbiAgICAoKCkgPT4ge3AucGFyc2VfYXJncyhbJy1kYycsICdkb2VzL25vdC9leGlzdC5qc29uJ10pO30pLnNob3VsZC50aHJvdygpO1xuICB9KTtcbiAgaXQoJ3Nob3VsZCBwYXJzZSBhcmdzIHRoYXQgYXJlIGNhcHMgaW50byBkZWZhdWx0IGNhcGFiaWxpdGllcycsIGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgZGVmYXVsdENhcGFiaWxpdGllcyA9IHtsb2NhbGl6YWJsZVN0cmluZ3NEaXI6ICcvbXkvZGlyJ307XG4gICAgbGV0IGFyZ3MgPSBwLnBhcnNlX2FyZ3MoWyctLWxvY2FsaXphYmxlLXN0cmluZ3MtZGlyJywgJy9teS9kaXInXSk7XG4gICAgYXJncy5kZWZhdWx0Q2FwYWJpbGl0aWVzLnNob3VsZC5lcWwoZGVmYXVsdENhcGFiaWxpdGllcyk7XG4gIH0pO1xuICBpdCgnc2hvdWxkIHBhcnNlIC0tYWxsb3ctaW5zZWN1cmUgY29ycmVjdGx5JywgZnVuY3Rpb24gKCkge1xuICAgIHAucGFyc2VfYXJncyhbXSkuYWxsb3dJbnNlY3VyZS5zaG91bGQuZXFsKFtdKTtcbiAgICBwLnBhcnNlX2FyZ3MoWyctLWFsbG93LWluc2VjdXJlJywgJyddKS5hbGxvd0luc2VjdXJlLnNob3VsZC5lcWwoW10pO1xuICAgIHAucGFyc2VfYXJncyhbJy0tYWxsb3ctaW5zZWN1cmUnLCAnZm9vJ10pLmFsbG93SW5zZWN1cmUuc2hvdWxkLmVxbChbJ2ZvbyddKTtcbiAgICBwLnBhcnNlX2FyZ3MoWyctLWFsbG93LWluc2VjdXJlJywgJ2ZvbyxiYXInXSkuYWxsb3dJbnNlY3VyZS5zaG91bGQuZXFsKFsnZm9vJywgJ2JhciddKTtcbiAgICBwLnBhcnNlX2FyZ3MoWyctLWFsbG93LWluc2VjdXJlJywgJ2ZvbyAsYmFyJ10pLmFsbG93SW5zZWN1cmUuc2hvdWxkLmVxbChbJ2ZvbycsICdiYXInXSk7XG4gIH0pO1xuICBpdCgnc2hvdWxkIHBhcnNlIC0tZGVueS1pbnNlY3VyZSBjb3JyZWN0bHknLCBmdW5jdGlvbiAoKSB7XG4gICAgcC5wYXJzZV9hcmdzKFtdKS5kZW55SW5zZWN1cmUuc2hvdWxkLmVxbChbXSk7XG4gICAgcC5wYXJzZV9hcmdzKFsnLS1kZW55LWluc2VjdXJlJywgJyddKS5kZW55SW5zZWN1cmUuc2hvdWxkLmVxbChbXSk7XG4gICAgcC5wYXJzZV9hcmdzKFsnLS1kZW55LWluc2VjdXJlJywgJ2ZvbyddKS5kZW55SW5zZWN1cmUuc2hvdWxkLmVxbChbJ2ZvbyddKTtcbiAgICBwLnBhcnNlX2FyZ3MoWyctLWRlbnktaW5zZWN1cmUnLCAnZm9vLGJhciddKS5kZW55SW5zZWN1cmUuc2hvdWxkLmVxbChbJ2ZvbycsICdiYXInXSk7XG4gICAgcC5wYXJzZV9hcmdzKFsnLS1kZW55LWluc2VjdXJlJywgJ2ZvbyAsYmFyJ10pLmRlbnlJbnNlY3VyZS5zaG91bGQuZXFsKFsnZm9vJywgJ2JhciddKTtcbiAgfSk7XG4gIGl0KCdzaG91bGQgcGFyc2UgLS1hbGxvdyBhbmQgLS1kZW55IGluc2VjdXJlIGZyb20gZmlsZXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgcGFyc2VkID0gcC5wYXJzZV9hcmdzKFtcbiAgICAgICctLWFsbG93LWluc2VjdXJlJywgQUxMT1dfRklYVFVSRSwgJy0tZGVueS1pbnNlY3VyZScsIERFTllfRklYVFVSRVxuICAgIF0pO1xuICAgIHBhcnNlZC5hbGxvd0luc2VjdXJlLnNob3VsZC5lcWwoWydmZWF0dXJlMScsICdmZWF0dXJlMicsICdmZWF0dXJlMyddKTtcbiAgICBwYXJzZWQuZGVueUluc2VjdXJlLnNob3VsZC5lcWwoWydub2ZlYXR1cmUxJywgJ25vZmVhdHVyZTInLCAnbm9mZWF0dXJlMyddKTtcbiAgfSk7XG59KTtcbiJdLCJmaWxlIjoidGVzdC9wYXJzZXItc3BlY3MuanMiLCJzb3VyY2VSb290IjoiLi4vLi4ifQ==
