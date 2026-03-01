const TAB_LIST = [
  {
    pagePath: "pages/home/home",
    text: "首页",
  },
  {
    pagePath: "pages/message/message",
    text: "消息",
  },
  {
    pagePath: "pages/publish/publish",
    text: "发布",
  },
  {
    pagePath: "pages/match/match",
    text: "匹配",
  },
  {
    pagePath: "pages/mine/mine",
    text: "我的",
  },
];

const TAB_LIST_INFO = [
  { index: 0, className: "icon-flash-outfithome" },
  {
    index: 1,
    className: "icon-flash-outfitmessage",
  },
  {
    index: 2,
    className: "icon-flash-outfitpublish",
  },
  {
    index: 3,
    className: "icon-flash-outfitmatch",
  },
  {
    index: 4,
    className: "icon-flash-outfitmine",
  },
];

const TAB_LIST_COMPLETED = TAB_LIST.map((item, index) => ({
  ...item,
  ...TAB_LIST_INFO[index],
}));

export { TAB_LIST, TAB_LIST_COMPLETED };
