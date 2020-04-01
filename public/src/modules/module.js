/*
 * 页面模块基类实现文件
 */
NEJ.define([
  'base/klass',
  'base/event',
  'base/element',
  'util/event',
  'util/template/tpl'
], function (k, _, e, t, l, p, pro) {
  // init template
  l._$parseTemplate('template-box');
  /**
   * 页面模块基类，实现页面的通用逻辑
   *
   * @class   _$$Module
   * @extends util/event._$$EventTarget
   * @param  {Object} options - 模块输入参数
   */
  p._$$Module = k._$klass();
  pro = p._$$Module._$extend(t._$$EventTarget);
  /**
   * 模块初始化
   * @protected
   * @param  {Object} options - 输入参数信息
   * @return {Void}
   */


  pro.__init = function (options) {
    this.__super(options);
  };
  /**
   * 模块重置逻辑
   * @protected
   * @param  {Object} options - 输入参数信息
   * @return {Void}
   */
  pro.__reset = function (options) {
    this.__super(options);
    // TODO something if necessary
  };
  /**
   * 模块销毁逻辑
   * @protected
   * @return {Void}
   */
  pro.__destroy = function () {
    this.__super();
    // TODO something if necessary
  };
});
