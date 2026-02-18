export default defineAppConfig({
    pages: ["pages/browse/browse", "pages/create/create", "pages/mine/mine"],
    window: {
        backgroundTextStyle: "light",
        navigationBarBackgroundColor: "#fff",
        navigationBarTitleText: "闪搭",
        navigationBarTextStyle: "black",
    },
    tabBar: {
        color: "#7A7E83",
        selectedColor: "#3cc51f",
        borderStyle: "black",
        backgroundColor: "#ffffff",
        list: [
            {
                pagePath: "pages/browse/browse",
                text: "浏览",
                // iconPath: "assets/icons/browse.png",
                // selectedIconPath: "assets/icons/browse-active.png",
            },
            {
                pagePath: "pages/create/create",
                text: "创建",
                // iconPath: "assets/icons/create.png",
                // selectedIconPath: "assets/icons/create-active.png",
            },
            {
                pagePath: "pages/mine/mine",
                text: "我的",
                // iconPath: "assets/icons/mine.png",
                // selectedIconPath: "assets/icons/mine-active.png",
            },
        ],
    },
});
