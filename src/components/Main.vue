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
      </a-form>
    </div>
    <div class="submit_btn">
      <a-button type="primary" block @click="handleGroup">开始分组</a-button>
    </div>

  </div>

</template>
<script setup lang="ts">
import { computed, reactive, useTemplateRef } from "vue";
import { message } from "ant-design-vue";
import type { FormInstance, Rule } from "ant-design-vue/es/form";
type groupSet = {
  folderPath: string;
  phoneNum: string;
  size: string;
  folderCount: string;
};
const groupSet: groupSet = reactive({
  folderPath: "",
  phoneNum: '1',
  size: '1',
  folderCount: '2',
});
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
};
// 选择文件夹
async function selectFolder() {
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
  // 验证表单
  await formRef.value?.validate()
    .then(() => {
      window.electronAPI.groupFiles(
        groupSet.folderPath,
        groupStep.value,
        groupSet.folderCount
      );
      message.success("分组完成！");
    })
    .catch((error: any) => {
      console.error(error);
      message.error("分组失败！");
    });
}

// 处理拖拽事件
const handleDrop = (event: DragEvent) => {
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
}
</style>
