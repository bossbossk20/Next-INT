angular.module('App', [])
  .controller('Controller', function ($http) {
    var app = this
    app.test = 'koy'
    $http.get('/temp_data').then((res) => {
      app.data = res.data
    })
  })
