'use strict';

/* http://docs.angularjs.org/guide/dev_guide.e2e-testing */

describe('my app', function() {

  beforeEach(function() {
    browser().navigateTo('../../app/index.html');
  });


  it('should automatically redirect to /view1 when location hash/fragment is empty', function() {
    expect(browser().location().url()).toBe("/view1");
  });


  describe('view1', function() {

    beforeEach(function() {
      browser().navigateTo('#/view1');
    });


    it('should render view1 when user navigates to /view1', function() {
        expect(element('[ng-view] p:first').text()).
          toMatch(/My shop/);
        expect(repeater('.products > div').count()).toBe(17);
    });


    it('should render product specific links', function() {
      element('.products div:first a:first').click();
      expect(browser().location().url()).toBe('/view2/haricots');
    });

  });


  describe('view2', function() {

    beforeEach(function() {
      browser().navigateTo('#/view2/haricots');
    });


    it('should display haricots page', function() {
      expect(binding('product.name')).toBe('Haricots verts');
    });


    it('should display the first product image as the main product image', function() {
      expect(element('img.product').attr('src')).toBe('img/products/515d4a25cf535.jpeg');
    });


    it('should swap main image if a thumbnail image is clicked on', function() {
      element('.product-thumbs li:nth-child(1) img').click();
      expect(element('img.product').attr('src')).toBe('img/products/Haricots.jpg');

      element('.product-thumbs li:nth-child(2) img').click();
      expect(element('img.product').attr('src')).toBe('img/products/Haricots_cuits.jpg');
    });

  });
});
