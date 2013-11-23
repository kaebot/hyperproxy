const Proxy = require('..')
const test = require('tap').test
const testServer = require('./server')
const testRequest = require('./request')
const localSocket = require('./localSocket')

test('proxy server: simple routing', function (t) {
  const servers = {
    json: makeServer('json'),
    xml: makeServer('xml'),
    dot: makeServer('dotpath'),
    default: makeServer('default'),
  }

  const proxySocket = localSocket('proxy-test.socket')

  const serverDefs = [
    ['test.localhost', [
      ['/api/*.json', servers.json.socket],
      ['/api/*.xml', servers.xml.socket],
      ['/.*', servers.dot.socket],
      ['*', servers.default.socket],
    ]],
  ]

  const proxy = new Proxy({ servers: serverDefs })

  const gateway = proxy
    .createServer()
    .listen(proxySocket)

  gateway.unref()

  t.plan(4)
  testRequest({
    socketPath: proxySocket,
    path: '/api/x/y/z.json',
    host: 'test.localhost',
    method: 'GET',
  }, function (proxyRes) {
    t.same(proxyRes.socketPath, servers.json.socket, 'should json')
  })

  testRequest({
    socketPath: proxySocket,
    path: '/api/v2/lol/rattleskates.xml',
    host: 'test.localhost',
    method: 'GET',
  }, function (proxyRes) {
    t.same(proxyRes.socketPath, servers.xml.socket, 'should xml')
  })

  testRequest({
    socketPath: proxySocket,
    path: '/.link',
    host: 'test.localhost',
    method: 'GET',
  }, function (proxyRes) {
    t.same(proxyRes.socketPath, servers.dot.socket, 'should dot')
  })

  testRequest({
    socketPath: proxySocket,
    path: '/literally/anything/else',
    host: 'test.localhost',
    method: 'GET',
  }, function (proxyRes) {
    t.same(proxyRes.socketPath, servers.default.socket, 'should default')
  })

})


function makeServer(name) {
  return testServer(localSocket(name + '.socket'))
}
