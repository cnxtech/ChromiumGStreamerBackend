/*
 * Copyright (C) 2008 Apple Inc. All Rights Reserved.
 * Copyright (C) 2011 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @implements {UI.ContextFlavorListener}
 * @unrestricted
 */
Sources.ScopeChainSidebarPane = class extends UI.VBox {
  constructor() {
    super();
    this._expandController = new Components.ObjectPropertiesSectionExpandController();
    this._linkifier = new Components.Linkifier();
    this._update();
  }

  /**
   * @override
   * @param {?Object} object
   */
  flavorChanged(object) {
    this._update();
  }

  _update() {
    var callFrame = UI.context.flavor(SDK.DebuggerModel.CallFrame);
    var details = UI.context.flavor(SDK.DebuggerPausedDetails);
    this._linkifier.reset();
    Sources.SourceMapNamesResolver.resolveThisObject(callFrame).then(this._innerUpdate.bind(this, details, callFrame));
  }

  /**
   * @param {?SDK.DebuggerPausedDetails} details
   * @param {?SDK.DebuggerModel.CallFrame} callFrame
   * @param {?SDK.RemoteObject} thisObject
   */
  _innerUpdate(details, callFrame, thisObject) {
    this.element.removeChildren();

    if (!details || !callFrame) {
      var infoElement = createElement('div');
      infoElement.className = 'gray-info-message';
      infoElement.textContent = Common.UIString('Not Paused');
      this.element.appendChild(infoElement);
      return;
    }

    var foundLocalScope = false;
    var scopeChain = callFrame.scopeChain();
    for (var i = 0; i < scopeChain.length; ++i) {
      var scope = scopeChain[i];
      var title = null;
      var emptyPlaceholder = null;
      var extraProperties = [];

      switch (scope.type()) {
        case Protocol.Debugger.ScopeType.Local:
          foundLocalScope = true;
          title = Common.UIString('Local');
          emptyPlaceholder = Common.UIString('No Variables');
          if (thisObject)
            extraProperties.push(new SDK.RemoteObjectProperty('this', thisObject));
          if (i === 0) {
            var exception = details.exception();
            if (exception) {
              extraProperties.push(new SDK.RemoteObjectProperty(
                  Common.UIString.capitalize('Exception'), exception, undefined, undefined, undefined, undefined,
                  undefined, true));
            }
            var returnValue = callFrame.returnValue();
            if (returnValue) {
              extraProperties.push(new SDK.RemoteObjectProperty(
                  Common.UIString.capitalize('Return ^value'), returnValue, undefined, undefined, undefined, undefined,
                  undefined, true));
            }
          }
          break;
        case Protocol.Debugger.ScopeType.Closure:
          var scopeName = scope.name();
          if (scopeName)
            title = Common.UIString('Closure (%s)', UI.beautifyFunctionName(scopeName));
          else
            title = Common.UIString('Closure');
          emptyPlaceholder = Common.UIString('No Variables');
          break;
        case Protocol.Debugger.ScopeType.Catch:
          title = Common.UIString('Catch');
          break;
        case Protocol.Debugger.ScopeType.Block:
          title = Common.UIString('Block');
          break;
        case Protocol.Debugger.ScopeType.Script:
          title = Common.UIString('Script');
          break;
        case Protocol.Debugger.ScopeType.With:
          title = Common.UIString('With Block');
          break;
        case Protocol.Debugger.ScopeType.Global:
          title = Common.UIString('Global');
          break;
      }

      var subtitle = scope.description();
      if (!title || title === subtitle)
        subtitle = undefined;

      var titleElement = createElementWithClass('div', 'scope-chain-sidebar-pane-section-header');
      titleElement.createChild('div', 'scope-chain-sidebar-pane-section-subtitle').textContent = subtitle;
      titleElement.createChild('div', 'scope-chain-sidebar-pane-section-title').textContent = title;

      var section = new Components.ObjectPropertiesSection(
          Sources.SourceMapNamesResolver.resolveScopeInObject(scope), titleElement, this._linkifier, emptyPlaceholder,
          true, extraProperties);
      this._expandController.watchSection(title + (subtitle ? ':' + subtitle : ''), section);

      if (scope.type() === Protocol.Debugger.ScopeType.Global)
        section.objectTreeElement().collapse();
      else if (!foundLocalScope || scope.type() === Protocol.Debugger.ScopeType.Local)
        section.objectTreeElement().expand();

      section.element.classList.add('scope-chain-sidebar-pane-section');
      this.element.appendChild(section.element);
    }
    this._sidebarPaneUpdatedForTest();
  }

  _sidebarPaneUpdatedForTest() {
  }
};

Sources.ScopeChainSidebarPane._pathSymbol = Symbol('path');
