(function () {
  "use strict";

// takes options object: { accessibleCaptions: boolean, autoplay: boolean, playButton: boolean }
        // defaults are: { accessibleCaptions: true, autoplay: false, playButton: true }

        var CarouselTablist = function (node, options) {
            // merge passed options with defaults
            options = Object.assign(
                { moreaccessible: false, paused: false, norotate: false },
                options || {}
            );

            // a prefers-reduced-motion user setting must always override autoplay
            var hasReducedMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            );
            if (hasReducedMotion.matches) {
                options.paused = true;
            }

            /* DOM properties */
            this.domNode = node;

            this.tablistNode = node.querySelector("[role=tablist]");
            this.containerNode = node.querySelector(".carousel-items");

            this.tabNodes = [];
            this.tabpanelNodes = [];

            this.liveRegionNode = node.querySelector(".carousel-items");
            this.pausePlayButtonNode = document.querySelector(
                ".carousel-tablist .controls button.rotation"
            );

            this.playLabel = "自動輪播停止中";
            this.pauseLabel = "自動輪播啟動中";

            /* 狀態屬性 */
            this.hasUserActivatedPlay = false; // 當使用者按下播放/暫停按鈕時會設為 true
            this.isAutoRotationDisabled = options.norotate; // 用來控制是否停用自動輪播
            this.isPlayingEnabled = !options.paused; // 此屬性也會在 updatePlaying 方法中設定
            this.timeInterval = 5000; // 幻燈片輪播的時間間隔（毫秒）
            this.currentIndex = 0; // 目前顯示的幻燈片索引
            this.slideTimeout = null; // 用來儲存 setTimeout 的參考值

            // 初始化選項卡（tabs）
            this.tablistNode.addEventListener(
                "focusin",
                this.handleTabFocus.bind(this)
            );
            this.tablistNode.addEventListener(
                "focusout",
                this.handleTabBlur.bind(this)
            );

            var nodes = node.querySelectorAll('[role="tab"]');

            for (var i = 0; i < nodes.length; i++) {
                var n = nodes[i];

                this.tabNodes.push(n);

                n.addEventListener("keydown", this.handleTabKeydown.bind(this));
                n.addEventListener("click", this.handleTabClick.bind(this));

                // 初始化對應的標籤面板（tabpanel）

                var tabpanelNode = document.getElementById(
                    n.getAttribute("aria-controls")
                );

                if (tabpanelNode) {
                    this.tabpanelNodes.push(tabpanelNode);

                    // 當 tabpanel 中的任何元素獲得焦點時，支援停止輪播
                    tabpanelNode.addEventListener(
                        "focusin",
                        this.handleTabpanelFocusIn.bind(this)
                    );
                    tabpanelNode.addEventListener(
                        "focusout",
                        this.handleTabpanelFocusOut.bind(this)
                    );

                    var imageLink = tabpanelNode.querySelector(".carousel-image a");

                    if (imageLink) {
                        imageLink.addEventListener(
                            "focus",
                            this.handleImageLinkFocus.bind(this)
                        );
                        imageLink.addEventListener(
                            "blur",
                            this.handleImageLinkBlur.bind(this)
                        );
                    }
                } else {
                    this.tabpanelNodes.push(null);
                }
            }

            // 暫停/播放按鈕
            if (this.pausePlayButtonNode) {
                this.pausePlayButtonNode.addEventListener(
                    "click",
                    this.handlePausePlayButtonClick.bind(this)
                );
            }

            // 處理滑鼠懸停事件
            this.domNode.addEventListener(
                "mouseover",
                this.handleMouseOver.bind(this)
            );
            this.domNode.addEventListener(
                "mouseout",
                this.handleMouseOut.bind(this)
            );

            // 根據 options 初始化輪播行為

            this.enableOrDisableAutoRotation(options.norotate); // 啟用或停用自動播放
            this.updatePlaying(!options.paused && !options.norotate); // 根據選項更新播放狀態
            this.setAccessibleStyling(options.moreaccessible); // 設定無障礙樣式
            this.rotateSlides(); // 啟動輪播
        };

        /* 公用函式：啟用或停用輪播，如果禁用，則隱藏播放/暫停按鈕 */
        CarouselTablist.prototype.enableOrDisableAutoRotation = function (
            disable
        ) {
            this.isAutoRotationDisabled = disable;
            this.pausePlayButtonNode.hidden = disable;
        };

        /* 公用函式：更新控制項與說明文字的樣式 */
        CarouselTablist.prototype.setAccessibleStyling = function (accessible) {
            if (accessible) {
                this.domNode.classList.add("carousel-tablist-moreaccessible");
            } else {
                this.domNode.classList.remove("carousel-tablist-moreaccessible");
            }
        };

        CarouselTablist.prototype.hideTabpanel = function (index) {
            var tabNode = this.tabNodes[index];
            var panelNode = this.tabpanelNodes[index];

            tabNode.setAttribute("aria-selected", "false");
            tabNode.setAttribute("tabindex", "-1");

            if (panelNode) {
                panelNode.classList.remove("active");
            }
        };

        CarouselTablist.prototype.showTabpanel = function (index, moveFocus) {
            var tabNode = this.tabNodes[index];
            var panelNode = this.tabpanelNodes[index];

            tabNode.setAttribute("aria-selected", "true");
            tabNode.removeAttribute("tabindex");

            if (panelNode) {
                panelNode.classList.add("active");
            }

            if (moveFocus) {
                tabNode.focus();
            }
        };

        CarouselTablist.prototype.setSelectedTab = function (index, moveFocus) {
            if (index === this.currentIndex) {
                return;
            }
            this.currentIndex = index;

            for (var i = 0; i < this.tabNodes.length; i++) {
                this.hideTabpanel(i);
            }

            this.showTabpanel(index, moveFocus);
        };

        CarouselTablist.prototype.setSelectedToPreviousTab = function (
            moveFocus
        ) {
            var nextIndex = this.currentIndex - 1;

            if (nextIndex < 0) {
                nextIndex = this.tabNodes.length - 1;
            }

            this.setSelectedTab(nextIndex, moveFocus);
        };

        CarouselTablist.prototype.setSelectedToNextTab = function (moveFocus) {
            var nextIndex = this.currentIndex + 1;

            if (nextIndex >= this.tabNodes.length) {
                nextIndex = 0;
            }

            this.setSelectedTab(nextIndex, moveFocus);
        };

        CarouselTablist.prototype.rotateSlides = function () {
            if (!this.isAutoRotationDisabled) {
                if (
                    (!this.hasFocus && !this.hasHover && this.isPlayingEnabled) ||
                    this.hasUserActivatedPlay
                ) {
                    this.setSelectedToNextTab(false);
                }
            }

            this.slideTimeout = setTimeout(
                this.rotateSlides.bind(this),
                this.timeInterval
            );
        };

        CarouselTablist.prototype.updatePlaying = function (play) {
            this.isPlayingEnabled = play;

            if (play) {
                this.pausePlayButtonNode.setAttribute("aria-label", this.pauseLabel);
                this.pausePlayButtonNode.classList.remove("play");
                this.pausePlayButtonNode.classList.add("pause");
                // this.liveRegionNode.setAttribute('aria-live', 'off');
            } else {
                this.pausePlayButtonNode.setAttribute("aria-label", this.playLabel);
                this.pausePlayButtonNode.classList.remove("pause");
                this.pausePlayButtonNode.classList.add("play");
                // this.liveRegionNode.setAttribute('aria-live', 'polite');
            }
        };

        /* 事件處理器 */

        CarouselTablist.prototype.handleImageLinkFocus = function () {
            // 當圖片連結獲得焦點時，加入 focus 樣式
            this.liveRegionNode.classList.add("focus");
        };

        CarouselTablist.prototype.handleImageLinkBlur = function () {
            // 當圖片連結失去焦點時，移除 focus 樣式
            this.liveRegionNode.classList.remove("focus");
        };

        CarouselTablist.prototype.handleMouseOver = function (event) {
            // 當滑鼠進入輪播範圍，但不是懸停在播放/暫停按鈕上時，設置為 hover 狀態
            if (!this.pausePlayButtonNode.contains(event.target)) {
                this.hasHover = true;
            }
        };

        CarouselTablist.prototype.handleMouseOut = function () {
            // 當滑鼠移出輪播範圍，取消 hover 狀態
            this.hasHover = false;
        };

        /* 播放/暫停按鈕的事件處理器 */

        CarouselTablist.prototype.handlePausePlayButtonClick = function () {
            // 使用者點擊播放/暫停按鈕時，切換播放狀態
            this.hasUserActivatedPlay = !this.isPlayingEnabled;
            this.updatePlaying(!this.isPlayingEnabled);
        };

        /* 選項卡（Tab）的事件處理器 */

        CarouselTablist.prototype.handleTabKeydown = function (event) {
            var flag = false;

            switch (event.key) {
                case "ArrowRight":
                    this.setSelectedToNextTab(true);
                    flag = true;
                    break;

                case "ArrowLeft":
                    this.setSelectedToPreviousTab(true);
                    flag = true;
                    break;

                case "Home":
                    this.setSelectedTab(0, true);
                    flag = true;
                    break;

                case "End":
                    this.setSelectedTab(this.tabNodes.length - 1, true);
                    flag = true;
                    break;

                default:
                    break;
            }

            if (flag) {
                event.stopPropagation();
                event.preventDefault();
            }
        };

        CarouselTablist.prototype.handleTabClick = function (event) {
            var index = this.tabNodes.indexOf(event.currentTarget);
            this.setSelectedTab(index, true);
        };

        CarouselTablist.prototype.handleTabFocus = function () {
            this.tablistNode.classList.add("focus");
            // this.liveRegionNode.setAttribute('aria-live', 'polite');
            this.hasFocus = true;
        };

        CarouselTablist.prototype.handleTabBlur = function () {
            this.tablistNode.classList.remove("focus");
            // if (this.playState) {
            //   this.liveRegionNode.setAttribute('aria-live', 'off');
            // }

            this.hasFocus = false;
        };

        /* 標籤面板（Tabpanels）的事件處理器 */

        CarouselTablist.prototype.handleTabpanelFocusIn = function () {
            // 當面板內有元素獲得焦點時，標記為已聚焦
            this.hasFocus = true;
        };

        CarouselTablist.prototype.handleTabpanelFocusOut = function () {
            // 當面板內元素失去焦點時，標記為未聚焦
            this.hasFocus = false;
        };

        /* 初始化 Carousel Tablists 及選項設定 */

        window.addEventListener(
            "load",
            function () {
                var carouselEls = document.querySelectorAll(".carousel-tablist"); // 抓取所有輪播元素
                var carousels = [];

                // 根據勾選框的預設狀態與 URL 參數來設定範例行為
                // 如果 URL 中有對應參數，也會更新勾選框的狀態
                var checkboxes = document.querySelectorAll(
                    ".carousel-options input[type=checkbox]"
                );
                var urlParams = new URLSearchParams(location.search);
                var carouselOptions = {};

                // 根據勾選框預設狀態與 URL 參數來初始化範例功能
                // 並更新勾選框狀態（例如 ?paused=true）
                checkboxes.forEach(function (checkbox) {
                    var checked = checkbox.checked;

                    if (urlParams.has(checkbox.value)) {
                        var urlParam = urlParams.get(checkbox.value);
                        if (typeof urlParam === "string") {
                            checked = urlParam === "true";
                            checkbox.checked = checked;
                        }
                    }

                    carouselOptions[checkbox.value] = checkbox.checked;
                });

                carouselEls.forEach(function (node) {
                    carousels.push(new CarouselTablist(node, carouselOptions));
                });

                // 為每個勾選框加入 change（變更）事件監聽器
                checkboxes.forEach(function (checkbox) {
                    var updateEvent;

                    // 根據勾選框的 value 設定要呼叫的更新方法
                    switch (checkbox.value) {
                        case "moreaccessible":
                            // 當 value 是 'moreaccessible' 時，對應要呼叫的函式是 setAccessibleStyling
                            updateEvent = "setAccessibleStyling";
                            break;
                        case "norotate":
                            // 當 value 是 'norotate' 時，對應要呼叫的函式是 enableOrDisableAutoRotation
                            updateEvent = "enableOrDisableAutoRotation";
                            break;
                    }

                    // 當勾選框狀態改變時，更新輪播的行為並更新網址參數
                    checkbox.addEventListener("change", function (event) {
                        urlParams.set(event.target.value, event.target.checked + "");
                        window.history.replaceState(
                            null,
                            "",
                            window.location.pathname + "?" + urlParams
                        );

                        if (updateEvent) {
                            carousels.forEach(function (carousel) {
                                carousel[updateEvent](event.target.checked);
                            });
                        }
                    });
                });




            },
            false
        );
})();
