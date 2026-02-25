<template>
  <div style=" padding: 50px; border: 2px #6EA4D2 dashed; border-radius: 20px" @dragover.prevent
    @drop.prevent="handleDrop">
    <div class="group_settings">
      <h1 class="select_folder_title">选择文件夹</h1>
      <a-form :model="groupSet" ref="formRef" name="groupForm" layout="vertical" hideRequiredMark="false" :rules="rules"
        :label-col="{ span: 8 }" autocomplete="off">
        <a-form-item style="margin-bottom: 32px;" name="folderPath">
          <div class="select_folder_content">
            <a-button type="primary" @click="selectFolder">选择文件夹</a-button>
            <a-input placeholder="请选择文件夹或将文件夹拖入虚框内" disabled v-model:value="groupSet.folderPath" />
          </div>
        </a-form-item>
        <h1 class="group_settings_title">分组设置</h1>
        <a-menu v-model:selectedKeys="menuSelectedKeys" mode="horizontal" :items="menuItems" @click="menuClick" />
        <div style="margin-top: 20px;">
          <div v-if="menuCurrent !== '0'">
            <a-form-item label="每组个数" name="numberPerGroup">
              <a-input class="group_settings_size_input" placeholder="请输入每组个数" :defaultValue="groupSet.numberPerGroup"
                v-model:value="groupSet.numberPerGroup" />
            </a-form-item>
          </div>
          <div v-else>
            <a-form-item label="设备数" name="phoneNum">
              <a-input class="group_settings_size_input" placeholder="请输入分组步长" :defaultValue="groupSet.phoneNum"
                v-model:value="groupSet.phoneNum" />
            </a-form-item>
            <a-form-item label="分组步长(每集张数)" name="size">
              <a-input class="group_settings_size_input" placeholder="请输入分组步长" :defaultValue="groupSet.size"
                v-model:value="groupSet.size" />
            </a-form-item>
            <a-form-item label="目标文件夹数" name="folderCount">
              <a-input class="group_settings_num_input" placeholder="请输入目标文件夹数" :defaultValue="groupSet.folderCount"
                v-model:value="groupSet.folderCount" />
            </a-form-item>
          </div>
        </div>
      </a-form>
    </div>
    <div class="submit_btn">
      <a-button type="primary" block :loading="isGrouping" :disabled="isGrouping" @click="handleGroup">开始分组</a-button>
      <div v-if="groupStatus === 'processing'" class="group_progress">
        <a-progress :percent="progressPercent" :show-info="true" />
        <div class="group_status_text">分组中: {{ progressPercent }}%</div>
      </div>
      <div v-if="groupStatus === 'success'" class="group_status_success">
        <span class="status_icon">✓</span>
        <span>分组完成</span>
      </div>
      <div v-if="groupStatus === 'error'" class="group_status_error">
        分组失败，请检查后重试
      </div>
    </div>

  </div>

</template>
<script setup lang="ts">
import { computed, reactive, useTemplateRef, ref, onMounted, onBeforeUnmount, watch } from "vue";
import { message, MenuProps } from "ant-design-vue";
import type { FormInstance, Rule } from "ant-design-vue/es/form";
import type { Key } from 'ant-design-vue/es/_util/type'
type groupSet = {
  folderPath: string;
  phoneNum: string;
  size: string;
  folderCount: string;
  groupType: string;
  numberPerGroup: string
};
type GroupProgressPayload = {
  percent: number
  status: 'processing' | 'success' | 'error'
  text: string
}
const menuSelectedKeys = ref<string[]>(['0']);
const menuCurrent = ref<Key>('0')
const isGrouping = ref(false)
const progressPercent = ref(0)
const groupStatus = ref<'idle' | 'processing' | 'success' | 'error'>('idle')
let statusTimer: ReturnType<typeof setTimeout> | null = null
const menuItems = ref<MenuProps['items']>([
  {
    key: '0',
    label: '按文件个数分组',
    title: '按文件个数分组',
  },
  {
    key: '1',
    label: '按每组个数分组',
    title: '按每组个数分组',
  },
]);
const menuClick: MenuProps['onClick'] = (e) => {
  menuCurrent.value = e.key
  groupSet.groupType = String(e.key)

}

//分组设置
const groupSet: groupSet = reactive({
  folderPath: "",
  phoneNum: '1',
  size: '1',
  folderCount: '2',
  groupType: '0',
  numberPerGroup: '500'
});
// 计算分组步长
const groupStep = computed<string>(() => {
  const groupStep = Number(groupSet.size);
  const phoneNum = Number(groupSet.phoneNum);
  return (groupStep * phoneNum).toString()
});
const formRef = useTemplateRef<FormInstance | null>("formRef");
const rules: Record<string, Rule[]> = {
  folderPath: [{ required: true, message: "请选择目标文件夹!" }],
  phoneNum: [
    { required: true, message: '请输入设备数!' },
    { pattern: /^[1-9]\d*$/, message: '设备数必须为正整数!' },
  ],
  size: [
    { required: true, message: '请输入分组步长!' },
    { pattern: /^[1-9]\d*$/, message: '分组步长必须为正整数!' },
  ],
  folderCount: [
    { required: true, message: '请输入目标文件夹数!' },
    { pattern: /^[1-9]\d*$/, message: '目标文件夹数必须为正整数!' },
  ],
  numberPerGroup: [
    { required: true, message: '请输入每组个数!' },
    { pattern: /^[1-9]\d*$/, message: '每组个数必须为正整数!' },
  ],
};
// 选择文件夹
async function selectFolder() {
  if (isGrouping.value) return
  const result = await window.electronAPI.selectFolder();
  if (result) {
    groupSet.folderPath = result;
    // console.log("Selected folder:", groupSet.folderPath);
    formRef.value?.validate()
    message.success("选择成功");
  } else {
    message.warning("取消选择");
  }
}
// 处理分组
async function handleGroup() {
  const validateFields = menuCurrent.value === '0'
    ? ['folderPath', 'phoneNum', 'size', 'folderCount']
    : ['folderPath', 'numberPerGroup']

  await formRef.value?.validateFields(validateFields)
    .then(async () => {
      isGrouping.value = true
      groupStatus.value = 'processing'
      progressPercent.value = 0
      await window.electronAPI.groupFiles({
        folderPath: groupSet.folderPath,
        groupType: groupSet.groupType,
        step: groupStep.value,
        folderCount: groupSet.folderCount,
        numberPerGroup: groupSet.numberPerGroup,
      });
      groupStatus.value = 'success'
      progressPercent.value = 100
      message.success("分组完成！");
    })
    .catch((error: any) => {
      console.error(error);
      groupStatus.value = 'error'
      message.error("分组失败！");
    })
    .finally(() => {
      isGrouping.value = false
    });
}

const onGroupProgress = (_event: unknown, payload: GroupProgressPayload) => {
  progressPercent.value = payload.percent
  if (payload.status === 'processing') {
    groupStatus.value = 'processing'
  } else if (payload.status === 'success') {
    groupStatus.value = 'success'
    progressPercent.value = 100
  } else if (payload.status === 'error') {
    groupStatus.value = 'error'
  }
}

onMounted(() => {
  window.ipcRenderer.on('group-files-progress', onGroupProgress)
})

onBeforeUnmount(() => {
  if (statusTimer) {
    clearTimeout(statusTimer)
    statusTimer = null
  }
  window.ipcRenderer.off('group-files-progress', onGroupProgress)
})

watch(groupStatus, (status) => {
  if (statusTimer) {
    clearTimeout(statusTimer)
    statusTimer = null
  }
  if (status === 'success' || status === 'error') {
    statusTimer = setTimeout(() => {
      groupStatus.value = 'idle'
      progressPercent.value = 0
    }, 10000)
  }
})

// 处理拖拽事件
const handleDrop = (event: DragEvent) => {
  if (isGrouping.value) return
  event.preventDefault();
  const items = event.dataTransfer?.items;
  if (items && items.length > 0) {
    const item = items[0];
    if (item.kind === "file" && item.webkitGetAsEntry()?.isDirectory) {
      const file = item.getAsFile();
      if (!file) {
        message.error("无法获取文件信息");
        return;
      }
      const path = file.path
      console.log("Drop event triggered", item, file);
      if (path) {
        groupSet.folderPath = path;
        formRef.value?.validate()
        message.success("文件夹已选择");
      }
    } else {
      message.error("请拖拽一个文件夹");
    }
  }

};
</script>
<style scoped lang="scss">
.select_folder {
  margin-bottom: 32px;
  text-align: left;

  &_title {
    font-size: 20px;
  }

  &_content {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    // margin-bottom: 32px;
  }
}

.group_settings {
  text-align: left;
  margin-bottom: 32px;

  &_title {
    font-size: 20px;
  }

  &_size {
    &_title {
      font-size: 14px;
    }
  }

  &_num {
    &_title {
      font-size: 14px;
    }
  }
}

.submit_btn {
  margin: 0 auto;
  width: 70%;
  text-align: center;

  .group_progress {
    margin-top: 16px;
    text-align: left;
  }

  .group_status_text {
    margin-top: 6px;
    font-size: 16px;
  }

  .group_status_success {
    margin-top: 12px;
    color: #52c41a;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 20px;
  }

  .status_icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #52c41a;
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    line-height: 1;
  }

  .group_status_error {
    margin-top: 12px;
    color: #ff4d4f;
    font-size: 16px;
    text-align: center;
  }
}
</style>
