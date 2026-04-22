<template>
  <div class="app">
    <div class="nav">
      <div class="container navInner">
        <div class="brand">AI visualization</div>
        <div class="links">
          <router-link class="link" to="/">上传</router-link>
          <router-link class="link" to="/report">报告</router-link>
        </div>
      </div>
    </div>
    <router-view />
    <footer class="footer">
      <div class="container muted">上传数据 → 一键生成分析报告与图表</div>
    </footer>
  </div>
</template>

<style scoped>
.app {
  min-height: 100svh;
  display: grid;
  grid-template-rows: auto 1fr auto;
}
.nav {
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(10px);
  background: rgba(11, 18, 32, 0.62);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.navInner {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand {
  font-weight: 750;
  letter-spacing: -0.02em;
}
.links {
  display: flex;
  gap: 10px;
}
.link {
  padding: 8px 10px;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.76);
}
.link.router-link-active {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.92);
  text-decoration: none;
}
.footer {
  padding: 18px 0 26px;
}
</style>
