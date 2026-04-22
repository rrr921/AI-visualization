import { createRouter, createWebHistory } from 'vue-router'

import UploadAnalyzeView from '../views/UploadAnalyzeView.vue'
import ReportView from '../views/ReportView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'upload',
      component: UploadAnalyzeView,
    },
    {
      path: '/report',
      name: 'report',
      component: ReportView,
    },
  ],
})

export default router

