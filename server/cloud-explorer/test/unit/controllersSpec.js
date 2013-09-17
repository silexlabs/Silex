'use strict';

/* jasmine specs for controllers go here */

describe('CE controllers', function()
{
	beforeEach(module('CEApp', function($provide) {
		$provide.constant( 'server.url', 'http://unifile.herokuapp.com/v1.0/' );
	}));
	beforeEach(module('ceControllers'));
	beforeEach(module('ceFileService'));

	// compare objects method (from angular tutorial)
	beforeEach( function() {
		this.addMatchers( {
			toEqualData: function(expected) {
				return angular.equals(this.actual, expected);
			}
		});
	});

	describe('CESidebarCtrl', function(serverUrl)
	{
		var scope, ctrl, $httpBackend;

		beforeEach( inject( function( _$httpBackend_, $rootScope, $controller )
		{
			$httpBackend = _$httpBackend_;
			$httpBackend.expectGET('http://unifile.herokuapp.com/v1.0/services/list/').  // FIXME inject server.url and use it here
				respond([
						  {
						    "display_name": "Dropbox",
						    "name": "dropbox",
						    "description": "This service let you use Dropbox cloud storage.",
						    "visible": true
						  },
						  {
						    "display_name": "Google Drive",
						    "name": "gdrive",
						    "description": "This service let you use google drive cloud storage.",
						    "visible": true
						  }
						]);

			scope = $rootScope.$new();
			ctrl = $controller('CESidebarCtrl', { $scope: scope });
		}));

		it('should create "services" model with 2 services fetched from xhr', function()
		{
			expect(scope.services).toEqual([]);
			$httpBackend.flush();

			expect(scope.services).toEqualData([
						  {
						    "display_name": "Dropbox",
						    "name": "dropbox",
						    "description": "This service let you use Dropbox cloud storage.",
						    "visible": true
						  },
						  {
						    "display_name": "Google Drive",
						    "name": "gdrive",
						    "description": "This service let you use google drive cloud storage.",
						    "visible": true
						  }
						]);
		});
	});


	/*describe('MyCtrl2', function()
	{
		var scope, $httpBackend, ctrl,
				xyzProductData = function() {
					return {
						name: 'product xyz',
								images: ['image/url1.png', 'image/url2.png']
					}
				};


		beforeEach(inject(function(_$httpBackend_, $rootScope, $routeParams, $controller) {
			$httpBackend = _$httpBackend_;
			$httpBackend.expectGET('data/xyz.json').respond(xyzProductData());

			$routeParams.productId = 'xyz';
			scope = $rootScope.$new();
			ctrl = $controller('MyCtrl2', {$scope: scope});
		}));


		it('should fetch product detail', function() {
			expect(scope.product).toEqualData({});
			$httpBackend.flush();

			expect(scope.product).toEqualData(xyzProductData());
		});
	});*/
});
