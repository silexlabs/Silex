
//////////////////////////////////////////////////
// Silex, live web creation
// http://projects.silexlabs.org/?/silex/
//
// Copyright (c) 2012 Silex Labs
// http://www.silexlabs.org/
//
// Silex is available under the GPL license
// http://www.silexlabs.org/silex/silex-licensing/
//////////////////////////////////////////////////

/**
 * @fileoverview Silex config
 */


goog.provide('silex.model.Config');

/**
 * The list of fonts the user can select
 */
silex.model.Config.fonts = {

    'Roboto' : {

        //the url to load the font file
        href : 'http://fonts.googleapis.com/css?family=Roboto:400,100,100italic,300,300italic,400italic,500,500italic,700,700italic,900,900italic',

        //the value for the CSS font-family value
        value : 'Roboto'
    },

    'Codystar' : {

        href : 'http://fonts.googleapis.com/css?family=Codystar:400',

        value : 'Codystar'
    },

    'Arial Black' : {
        value : 'Arial Black, Gadget, sans-serif'
    },

    'Impact' : {
        value : 'Impact, Charcoal, sans-serif'
    },

    'Lucida Console' : {
        value : 'Lucida Console, Monaco, monospace'
    },

    'Lucida Sans' : {
        value : 'Lucida Sans Unicode, Lucida Grande, sans-serif'
    },

    'Palatino' : {
        value : 'Palatino Linotype, Book Antiqua, Palatino, serif'
    },

    'Tahoma' : {
        value : 'Tahoma, Geneva, sans-serif'
    },
};
