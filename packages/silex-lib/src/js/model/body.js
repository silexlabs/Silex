  this.headElement = goog.dom.createElement('div');
  this.bodyElement = goog.dom.getElementByClass('silex-stage-body', this.element);
  // make the body pageable
  silex.model.Element.prototype.setPageable(this.bodyElement, true);
  // allow drops
  silex.utils.JQueryEditable.setDropableOnly(this.bodyElement);

