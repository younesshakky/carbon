'use strict';

var Utils = require('../utils');
var Selection = require('../selection');
var Component = require('../component');

/**
 * YouTubeComponent main.
 * @param {Object} optParams Optional params to initialize the object.
 * Default:
 *   {
 *     src: '',
 *     caption: null,
 *     width: '100%',
 *     height: '360px',
 *     name: Utils.getUID()
 *   }
 */
var YouTubeComponent = function(optParams) {
  // Override default params with passed ones if any.
  var params = Utils.extend({
    src: '',
    caption: null,
    width: '100%',

    // TODO(mkhatib): Implement and auto-height mode where it can calculate
    // the best ratio for the player.
    height: '360px',
    // Generate a UID as a reference for this YouTubeComponent.
    name: Utils.getUID()
  }, optParams);

  /**
   * Name to reference this YouTubeComponent.
   * @type {string}
   */
  this.name = params.name;
  Utils.setReference(this.name, this);

  /**
   * Internal model text in this YouTubeComponent.
   * @type {string}
   */
  this.src = params.src;

  this.width = params.width;
  this.height = params.height;

  /**
   * Placeholder text to show if the YouTubeComponent is empty.
   * @type {string}
   */
  this.caption = params.caption;

  /**
   * DOM element tied to this object.
   * @type {HTMLElement}
   */
  this.dom = document.createElement(YouTubeComponent.CONTAINER_TAG_NAME);
  this.dom.setAttribute('contenteditable', false);
  this.dom.setAttribute('name', this.name);

  this.overlayDom = document.createElement(
      YouTubeComponent.VIDEO_OVERLAY_TAG_NAME);
  this.overlayDom.className = YouTubeComponent.VIDEO_OVERLAY_CLASS_NAME;
  this.dom.appendChild(this.overlayDom);
  this.overlayDom.addEventListener('click', this.handleClick.bind(this));

  this.captionDom = document.createElement(YouTubeComponent.CAPTION_TAG_NAME);
  this.captionDom.setAttribute('contenteditable', true);

  this.videoDom = document.createElement(YouTubeComponent.VIDEO_TAG_NAME);

  if (this.caption) {
    this.captionDom.innerText = this.caption;
    this.dom.appendChild(this.captionDom);
  }

  if (this.src) {
    this.videoDom.setAttribute('src', this.src);
    this.videoDom.setAttribute('frameborder', 0);
    this.videoDom.setAttribute('allowfullscreen', true);
    if (this.width) {
      this.videoDom.setAttribute('width', this.width);
    }
    if (this.height) {
      this.videoDom.setAttribute('height', this.height);
    }
    this.dom.appendChild(this.videoDom);
  }
};
YouTubeComponent.prototype = new Component();
module.exports = YouTubeComponent;


/**
 * YouTubeComponent component container element tag name.
 * @type {string}
 */
YouTubeComponent.CONTAINER_TAG_NAME = 'figure';


/**
 * Video element tag name.
 * @type {string}
 */
YouTubeComponent.VIDEO_OVERLAY_TAG_NAME = 'div';


/**
 * Video element tag name.
 * @type {string}
 */
YouTubeComponent.VIDEO_TAG_NAME = 'iframe';


/**
 * Caption element tag name.
 * @type {string}
 */
YouTubeComponent.CAPTION_TAG_NAME = 'figcaption';


/**
 * Video element tag name.
 * @type {string}
 */
YouTubeComponent.VIDEO_OVERLAY_CLASS_NAME = 'video-overlay';


/**
 * Regex strings list that for matching YouTube URLs.
 * @type {Array.<string>}
 */
YouTubeComponent.YOUTUBE_URL_REGEXS = [
    '(?:https?://(?:www\.)?youtube\.com\/(?:[^\/]+/.+/|' +
    '(?:v|e(?:mbed)?)/|.*[?&]v=)|' +
    'youtu\.be/)([^"&?/ ]{11})'
];


/**
 * Registers regular experessions to create YouTube component from if matched.
 * @param  {ComponentFactory} componentFactory The component factory to register
 * the regex with.
 */
YouTubeComponent.registerRegexes = function(componentFactory) {
  for (var i = 0; i < YouTubeComponent.YOUTUBE_URL_REGEXS.length; i++) {
    componentFactory.registerRegex(
        YouTubeComponent.YOUTUBE_URL_REGEXS[i],
        YouTubeComponent.createYouTubeComponentFromLink);
  }
};


/**
 * Creates a YouTube video component from a link.
 * @param  {string} link YouTube video URL.
 * @return {YouTubeComponent} YouTubeComponent component created from the link.
 */
YouTubeComponent.createYouTubeComponentFromLink = function (link) {
  var src = link;
  for (var i = 0; i < YouTubeComponent.YOUTUBE_URL_REGEXS.length; i++) {
    var regex = new RegExp(YouTubeComponent.YOUTUBE_URL_REGEXS);
    var matches = regex.exec(link);
    if (matches) {
      src = YouTubeComponent.createEmbedSrcFromId(matches[1]);
      break;
    }
  }
  return new YouTubeComponent({src: src});
};


/**
 * Returns the embed src URL for the id.
 * @param  {string} id YouTube video ID.
 * @return {string} Embed src URL.
 */
YouTubeComponent.createEmbedSrcFromId = function (id) {
  return 'https://www.youtube.com/embed/' + id +
    '?rel=0&amp;showinfo=0&amp;iv_load_policy=3';
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this YouTubeComponent.
 */
YouTubeComponent.prototype.getJSONModel = function() {
  var video = {
    name: this.name,
    src: this.src,
    caption: this.caption
  };

  return video;
};


/**
 * Handles clicking on the youtube component to update the selection.
 */
YouTubeComponent.prototype.handleClick = function () {
  var selection = Selection.getInstance();
  selection.setCursor({
    component: this,
    offset: 0
  });

  // TODO(mkhatib): Unselect the component when the video plays to allow the
  // user to select it again and delete it.
  return false;
};


/**
 * Returns the operations to execute a deletion of the YouTube component.
 * @param  {number=} optIndexOffset An offset to add to the index of the
 * component for insertion point.
 * @return {Array.<Object>} List of operations needed to be executed.
 */
YouTubeComponent.prototype.getDeleteOps = function (optIndexOffset) {
  return [{
    do: {
      op: 'deleteComponent',
      component: this.name
    },
    undo: {
      op: 'insertComponent',
      componentClass: 'YouTubeComponent',
      section: this.section.name,
      component: this.name,
      index: this.getIndexInSection() + (optIndexOffset || 0),
      attrs: {
        src: this.src,
        caption: this.caption,
        width: this.width
      }
    }
  }];
};


/**
 * Returns the operations to execute inserting a youtube component.
 * @param {number} index Index to insert the youtube component at.
 * @return {Array.<Object>} Operations for inserting the youtube component.
 */
YouTubeComponent.prototype.getInsertOps = function (index) {
  return [{
    do: {
      op: 'insertComponent',
      componentClass: 'YouTubeComponent',
      section: this.section.name,
      cursorOffset: 0,
      component: this.name,
      index: index,
      attrs: {
        src: this.src,
        width: this.width,
        caption: this.caption
      }
    },
    undo: {
      op: 'deleteComponent',
      component: this.name
    }
  }];
};


/**
 * Returns the length of the youtube component content.
 * @return {number} Length of the youtube component content.
 */
YouTubeComponent.prototype.getLength = function () {
  return 1;
};