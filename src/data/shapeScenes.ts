import type { ShapeKind, ShapeScene, ShapeSlot } from './puzzleGames';

function part(kind: ShapeKind, label: string, x: number, y: number, size: number, rotation = 0): ShapeSlot {
  return { id: label, kind, label, x, y, size, rotation };
}

const triangle = (label: string, x: number, y: number, size: number, rotation = 0) => part('triangle', label, x, y, size, rotation);
const square = (label: string, x: number, y: number, size: number) => part('square', label, x, y, size);
const rectangle = (label: string, x: number, y: number, size: number, rotation = 0) => part('rectangle', label, x, y, size, rotation);
const circle = (label: string, x: number, y: number, size: number) => part('circle', label, x, y, size);

// Parts are in paint order; later parts leave earlier touch-target centers clear.
export const SHAPE_SCENES: ShapeScene[] = [
  { title: '小房子', slots: [
    triangle('屋顶', 100, 0, 120), square('房身', 100, 108, 120),
  ] },
  { title: '小火车', slots: [
    rectangle('长车身', 70, 40, 180), square('驾驶室', 160, 0, 90),
    circle('左边车轮', 80, 170, 60), circle('右边车轮', 180, 170, 60),
  ] },
  { title: '双塔城堡', slots: [
    triangle('左边塔尖', 65, 40, 90), triangle('右边塔尖', 165, 40, 90),
    square('左边塔楼', 65, 120, 90), square('右边塔楼', 165, 120, 90),
  ] },
  { title: '小鱼', slots: [
    circle('小鱼身体', 65, 70, 120), triangle('小鱼尾巴', 174, 85, 90, 270),
  ] },
  { title: '小火箭', slots: [
    triangle('火箭头', 120, 0, 80), square('火箭身体', 120, 72, 80),
    triangle('左边机翼', 48, 100, 80, 270), triangle('右边机翼', 192, 100, 80, 90),
  ] },
  { title: '小松树', slots: [
    triangle('树冠', 90, 0, 140), rectangle('树干', 110, 128, 100, 90),
  ] },
  { title: '棒棒糖', slots: [
    circle('糖果', 100, 10, 120), rectangle('糖果棒', 100, 116, 120, 90),
  ] },
  { title: '小气球', slots: [
    circle('气球', 90, 5, 140), triangle('气球结', 130, 136, 60, 180),
  ] },
  { title: '小旗子', slots: [
    rectangle('旗杆', 70, 70, 100, 90), triangle('旗面', 140, 20, 100, 90),
  ] },
  { title: '小帐篷', slots: [
    triangle('帐篷', 70, 0, 180), triangle('帐篷门', 120, 96, 80),
  ] },
  { title: '冰淇淋', slots: [
    circle('冰淇淋球', 105, 0, 110), triangle('蛋筒', 85, 100, 150, 180),
  ] },
  { title: '小沙漏', slots: [
    triangle('上面的小漏斗', 110, 10, 100, 180), triangle('下面的小漏斗', 110, 102, 100),
  ] },
  { title: '大山和太阳', slots: [
    triangle('大山', 30, 80, 180), circle('太阳', 190, 0, 90),
  ] },
  { title: '小雪人', slots: [
    circle('雪人的头', 115, 0, 90), circle('雪人的身体', 90, 76, 140),
  ] },
  { title: '小雨伞', slots: [
    triangle('伞面', 80, 0, 160), rectangle('伞杆', 105, 148, 110, 90),
    circle('伞柄', 132, 217, 60),
  ] },
  { title: '小台灯', slots: [
    rectangle('灯座', 100, 159, 120), rectangle('灯杆', 110, 108, 100, 90),
    triangle('灯罩', 100, 0, 120),
  ] },
  { title: '圆冠大树', slots: [
    circle('圆圆的树冠', 85, 0, 150), rectangle('树干', 110, 135, 100, 90),
  ] },
  { title: '小鸟', slots: [
    circle('小鸟身体', 80, 70, 120), triangle('鸟嘴', 180, 85, 60, 90),
    triangle('小鸟尾巴', 30, 110, 80, 270),
  ] },
  { title: '小乌龟', slots: [
    circle('龟壳', 60, 60, 150), circle('乌龟的头', 200, 100, 60),
    rectangle('乌龟的小脚', 95, 139, 130),
  ] },
  { title: '小猫', slots: [
    circle('猫咪的脸', 95, 80, 130), triangle('左耳朵', 85, 20, 70),
    triangle('右耳朵', 165, 20, 70),
  ] },
  { title: '小熊', slots: [
    circle('小熊的脸', 90, 90, 140), circle('左耳朵', 82, 57, 60),
    circle('右耳朵', 178, 57, 60),
  ] },
  { title: '小兔', slots: [
    circle('兔子的脸', 90, 100, 140), rectangle('左耳朵', 66, 25, 100, 90),
    rectangle('右耳朵', 154, 25, 100, 90),
  ] },
  { title: '小狗', slots: [
    square('狗狗的脸', 100, 90, 120), rectangle('左耳朵', 35, 50, 100, 90),
    rectangle('右耳朵', 185, 50, 100, 90),
  ] },
  { title: '展翅的猫头鹰', slots: [
    circle('猫头鹰身体', 85, 60, 150), triangle('左翅膀', 20, 145, 85, 270),
    triangle('右翅膀', 215, 145, 85, 90),
  ] },
  { title: '小蝴蝶', slots: [
    triangle('左上翅膀', 60, 30, 100, 270), triangle('右上翅膀', 152, 30, 100, 90),
    triangle('左下翅膀', 60, 122, 100, 270), triangle('右下翅膀', 152, 122, 100, 90),
  ] },
  { title: '小风筝', slots: [
    triangle('风筝上半边', 110, 0, 100), triangle('风筝下半边', 110, 92, 100, 180),
    rectangle('风筝尾巴', 120, 183, 80, 90),
  ] },
  { title: '小汽车', slots: [
    rectangle('车身', 80, 50, 160), triangle('车顶', 110, 0, 100),
    circle('左边车轮', 90, 165, 60), circle('右边车轮', 180, 165, 60),
  ] },
  { title: '小卡车', slots: [
    rectangle('货箱', 10, 15, 160), square('驾驶室', 154, 50, 90),
    circle('后轮', 40, 130, 70), circle('前轮', 170, 130, 70),
  ] },
  { title: '拖拉机', slots: [
    rectangle('车身', 20, 50, 140), square('驾驶室', 115, 10, 80),
    circle('大车轮', 115, 146, 90), circle('小车轮', 40, 150, 60),
  ] },
  { title: '公交车', slots: [
    rectangle('长长的车身', 50, 0, 220), circle('左边车轮', 65, 160, 70),
    circle('右边车轮', 185, 160, 70),
  ] },
  { title: '双帆小船', slots: [
    rectangle('船身', 70, 90, 180), triangle('左船帆', 85, 60, 80),
    triangle('右船帆', 155, 60, 80),
  ] },
  { title: '小轮船', slots: [
    rectangle('大船身', 60, 60, 200), rectangle('船舱', 110, 30, 100),
    triangle('船上的旗子', 170, 0, 90, 90),
  ] },
  { title: '小飞机', slots: [
    rectangle('飞机身体', 80, 40, 160, 90), triangle('飞机头', 120, 0, 80),
    triangle('左机翼', 25, 120, 100, 270), triangle('右机翼', 195, 120, 100, 90),
  ] },
  { title: '直升机', slots: [
    rectangle('螺旋桨', 90, 0, 180), rectangle('机尾', 0, 82, 140),
    circle('驾驶舱', 120, 100, 120),
  ] },
  { title: '小潜艇', slots: [
    circle('潜艇身体', 100, 100, 160), circle('尾翼', 44, 135, 70),
    rectangle('潜望镜', 130, 16, 100, 90),
  ] },
  { title: '小桥', slots: [
    rectangle('桥面', 70, 0, 180), rectangle('左桥墩', 35, 110, 140, 90),
    rectangle('右桥墩', 145, 110, 140, 90),
  ] },
  { title: '小门楼', slots: [
    triangle('门楼顶', 60, 0, 200), rectangle('左柱子', 40, 180, 100, 90),
    rectangle('右柱子', 180, 180, 100, 90),
  ] },
  { title: '灯塔和月亮', slots: [
    triangle('灯塔顶', 100, 20, 120), square('灯塔', 110, 130, 100),
    circle('月亮', 240, 0, 60),
  ] },
  { title: '三层宝塔', slots: [
    triangle('下面的塔层', 90, 115, 140), triangle('中间的塔层', 100, 35, 120),
    triangle('上面的塔层', 115, 0, 90),
  ] },
  { title: '小城门', slots: [
    rectangle('城门横梁', 80, 50, 160), square('左塔楼', 55, 140, 90),
    square('右塔楼', 175, 140, 90),
  ] },
  { title: '小花', slots: [
    circle('左花瓣', 70, 20, 100), circle('右花瓣', 150, 20, 100),
    circle('下花瓣', 110, 85, 100), rectangle('花茎', 110, 167, 100, 90),
  ] },
  { title: '小花盆', slots: [
    rectangle('花盆', 90, 136, 140), rectangle('花茎', 110, 80, 100, 90),
    circle('花朵', 110, 0, 100),
  ] },
  { title: '长叶子的树', slots: [
    rectangle('树干', 100, 130, 120, 90), triangle('左树叶', 35, 40, 100, 270),
    triangle('右树叶', 185, 40, 100, 90), circle('树冠', 115, 0, 90),
  ] },
  { title: '礼物盒', slots: [
    square('礼物盒', 90, 120, 140), triangle('左蝴蝶结', 70, 32, 100, 90),
    triangle('右蝴蝶结', 150, 32, 100, 270),
  ] },
  { title: '小书架', slots: [
    rectangle('书架', 70, 100, 180), rectangle('左边的书', 55, 55, 100, 90),
    rectangle('右边的书', 165, 55, 100, 90),
  ] },
  { title: '小奖杯', slots: [
    rectangle('奖杯底座', 110, 175, 100), triangle('奖杯', 90, 0, 140, 180),
    rectangle('奖杯杆', 115, 129, 90, 90),
  ] },
  { title: '小铲车', slots: [
    rectangle('车身', 85, 50, 140), square('驾驶室', 115, 10, 80),
    circle('车轮', 100, 145, 80), triangle('铲斗', 10, 125, 100, 270),
  ] },
  { title: '翘尾小鱼', slots: [
    circle('小鱼身体', 65, 70, 140), triangle('翘起的尾巴', 184, 20, 90),
    triangle('小鱼鳍', 50, 155, 80, 180),
  ] },
  { title: '小风车', slots: [
    triangle('左上叶片', 80, 60, 80), triangle('右上叶片', 152, 60, 80, 90),
    triangle('右下叶片', 152, 132, 80, 180), triangle('左下叶片', 80, 132, 80, 270),
  ] },
  { title: '小机器人', slots: [
    rectangle('机器人身体', 90, 58, 140), square('机器人的头', 110, 0, 100),
    rectangle('左腿', 72, 157, 80, 90), rectangle('右腿', 168, 157, 80, 90),
  ] },
  { title: '林间小屋', slots: [
    triangle('小屋屋顶', 30, 40, 100), square('小屋房身', 30, 130, 100),
    triangle('松树树冠', 185, 50, 100), rectangle('松树树干', 195, 145, 80, 90),
    circle('林间太阳', 130, 0, 60),
  ] },
  { title: '蘑菇小屋', slots: [
    triangle('蘑菇伞', 90, 0, 140), square('蘑菇房间', 120, 132, 80),
    circle('左边小石头', 35, 125, 60), circle('右边小石头', 225, 125, 60),
    rectangle('门前小路', 120, 195, 80, 90),
  ] },
  { title: '高架小桥', slots: [
    rectangle('高高的桥面', 40, 0, 240), rectangle('左桥柱', 35, 145, 100, 90),
    rectangle('右桥柱', 185, 145, 100, 90), circle('左边水波', 110, 210, 60),
    circle('右边水波', 170, 210, 60),
  ] },
  { title: '运货小车', slots: [
    rectangle('货箱', 10, 30, 140), triangle('尖尖的车头', 155, 60, 90, 90),
    circle('后车轮', 30, 155, 60), circle('中间车轮', 110, 155, 60),
    circle('前车轮', 205, 155, 60),
  ] },
  { title: '帆船码头', slots: [
    rectangle('帆船船身', 100, 90, 180), triangle('左船帆', 105, 5, 90),
    triangle('右船帆', 190, 5, 90), rectangle('码头柱子', 10, 115, 80, 90),
    circle('救生圈', 220, 215, 60),
  ] },
  { title: '小鸡出壳', slots: [
    circle('小鸡身体', 110, 70, 100), circle('小鸡脑袋', 170, 10, 80),
    triangle('小鸡嘴巴', 240, 25, 60, 90), triangle('左边蛋壳', 70, 170, 90, 270),
    triangle('右边蛋壳', 160, 170, 90, 90),
  ] },
  { title: '慢慢爬的蜗牛', slots: [
    rectangle('蜗牛的脚', 75, 120, 160), circle('蜗牛壳', 80, 25, 130),
    circle('蜗牛脑袋', 220, 130, 80), rectangle('左触角', 200, 55, 70, 90),
    rectangle('右触角', 250, 55, 70, 90),
  ] },
  { title: '音乐小鼓', slots: [
    circle('圆鼓', 100, 90, 120), rectangle('鼓的上沿', 100, 20, 120),
    rectangle('鼓的下沿', 100, 160, 120), rectangle('左鼓槌', 5, 25, 80, 90),
    rectangle('右鼓槌', 235, 25, 80, 90),
  ] },
  { title: '花园路标', slots: [
    rectangle('路标柱子', 120, 90, 100, 90), triangle('向左的箭头', 35, 35, 90, 270),
    triangle('向右的箭头', 195, 35, 90, 90), circle('路边花朵', 30, 170, 60),
    square('草地', 210, 185, 80),
  ] },
  { title: '星夜露营', slots: [
    triangle('大帐篷', 80, 60, 140), triangle('帐篷入口', 125, 150, 60),
    circle('月亮', 230, 0, 70), triangle('小篝火', 10, 180, 70),
    rectangle('篝火木头', 10, 220, 60, 90),
  ] },
  { title: '双层巴士', slots: [
    rectangle('上层车厢', 75, 0, 140), rectangle('下层车厢', 70, 100, 160),
    circle('后车轮', 80, 205, 60), circle('前车轮', 180, 205, 60),
    circle('上层车窗', 150, 30, 60), triangle('车头', 235, 145, 70, 90),
  ] },
  { title: '长颈鹿', slots: [
    square('长颈鹿身体', 80, 145, 100), rectangle('长脖子', 150, 45, 90, 90),
    circle('长颈鹿脑袋', 165, 0, 80), rectangle('后腿', 65, 210, 70, 90),
    rectangle('前腿', 145, 210, 70, 90), triangle('小尾巴', 10, 150, 70, 270),
  ] },
  { title: '机器小狗', slots: [
    square('小狗身体', 90, 90, 120), square('小狗脑袋', 210, 30, 80),
    rectangle('前腿', 160, 200, 70, 90), rectangle('后腿', 70, 200, 70, 90),
    triangle('翘尾巴', 10, 50, 80, 270), triangle('小耳朵', 230, 0, 60, 180),
  ] },
  { title: '田野风车', slots: [
    square('风车小屋', 115, 155, 90), triangle('小屋屋顶', 115, 72, 90),
    triangle('左上叶片', 45, 0, 70, 270), triangle('右上叶片', 205, 0, 70),
    triangle('左下叶片', 45, 72, 70, 180), triangle('右下叶片', 205, 72, 70, 90),
  ] },
  { title: '草莓小蛋糕', slots: [
    rectangle('左边蛋糕', 20, 135, 90), rectangle('中间蛋糕', 115, 135, 90),
    rectangle('右边蛋糕', 210, 135, 90), triangle('左边草莓', 35, 55, 60, 180),
    triangle('中间草莓', 130, 55, 60, 180), triangle('右边草莓', 225, 55, 60, 180),
  ] },
  { title: '快乐毛毛虫', slots: [
    circle('第一节身体', 30, 110, 80), circle('第二节身体', 110, 110, 80),
    circle('第三节身体', 190, 110, 80), circle('毛毛虫脑袋', 230, 35, 80),
    triangle('左触角', 190, 0, 60, 270), triangle('右触角', 260, 0, 60, 90),
  ] },
  { title: '哨兵猫头鹰', slots: [
    circle('猫头鹰身体', 110, 90, 100), circle('左眼睛', 90, 15, 70),
    circle('右眼睛', 170, 15, 70), triangle('左翅膀', 20, 95, 80, 270),
    triangle('右翅膀', 220, 95, 80, 90), triangle('猫头鹰尾羽', 125, 190, 70, 180),
  ] },
  { title: '火车进山', slots: [
    rectangle('火车车厢', 20, 90, 130), square('火车头', 165, 100, 90),
    circle('后车轮', 30, 205, 60), circle('前车轮', 180, 205, 60),
    triangle('远处的山', 70, 0, 100), rectangle('烟囱', 165, 20, 80, 90),
  ] },
  { title: '阳台小屋', slots: [
    triangle('大屋顶', 90, 0, 140), square('左房间', 45, 140, 100),
    square('右房间', 175, 140, 100), rectangle('中间阳台', 100, 85, 120),
    triangle('旁边的小树', 0, 50, 80, 270), circle('早晨的太阳', 240, 10, 60),
  ] },
  { title: '海底世界', slots: [
    circle('大鱼身体', 90, 50, 120), triangle('大鱼尾巴', 210, 80, 80, 90),
    triangle('大鱼鳍', 100, 170, 70, 180), circle('右边气泡', 220, 0, 60),
    circle('左边气泡', 20, 20, 60), rectangle('水草', 10, 150, 100, 90),
  ] },
  { title: '大小雪人', slots: [
    circle('大雪人身体', 20, 120, 110), circle('大雪人脑袋', 40, 40, 70),
    circle('小雪人身体', 180, 140, 90), circle('小雪人脑袋', 195, 80, 60),
    triangle('大雪人帽子', 45, 0, 60), rectangle('中间的小路', 130, 190, 60, 90),
  ] },
  { title: '鸟妈妈和宝宝', slots: [
    circle('鸟妈妈身体', 20, 100, 120), circle('鸟宝宝身体', 195, 145, 80),
    triangle('鸟妈妈嘴巴', 135, 115, 60, 90), triangle('鸟宝宝嘴巴', 260, 155, 60, 90),
    triangle('鸟妈妈尾巴', 0, 25, 80, 270), triangle('鸟宝宝尾巴', 170, 70, 60, 270),
  ] },
  { title: '大船和小船', slots: [
    rectangle('大船船身', 20, 100, 150), triangle('大船帆', 50, 0, 100),
    triangle('大船旗子', 0, 10, 60, 90), rectangle('小船船身', 210, 170, 90),
    triangle('小船帆', 215, 100, 80), circle('海上太阳', 240, 0, 60),
  ] },
  { title: '海港双塔', slots: [
    rectangle('高灯塔', 30, 100, 110, 90), rectangle('矮灯塔', 210, 140, 80, 90),
    triangle('高塔屋顶', 30, 0, 110), triangle('矮塔屋顶', 210, 65, 80),
    circle('月亮', 135, 100, 60), circle('海上浮标', 120, 200, 60),
  ] },
  { title: '大小风筝', slots: [
    triangle('大风筝上半边', 20, 0, 110), triangle('大风筝下半边', 20, 100, 110, 180),
    triangle('小风筝上半边', 200, 60, 80), triangle('小风筝下半边', 200, 132, 80, 180),
    rectangle('大风筝尾巴', 45, 200, 60, 90), rectangle('小风筝尾巴', 210, 210, 60, 90),
  ] },
  { title: '荷塘小鸭', slots: [
    circle('鸭妈妈身体', 40, 80, 120), circle('小鸭身体', 210, 125, 80),
    triangle('鸭妈妈嘴巴', 155, 95, 60, 90), triangle('小鸭嘴巴', 260, 75, 60, 90),
    circle('圆荷叶', 5, 205, 70), triangle('尖荷叶', 180, 215, 60, 270),
  ] },
  { title: '大小礼盒', slots: [
    square('大礼物盒', 25, 140, 120), square('小礼物盒', 210, 170, 80),
    triangle('大蝴蝶结左边', 5, 50, 80, 90), triangle('大蝴蝶结右边', 85, 50, 80, 270),
    triangle('小蝴蝶结左边', 190, 110, 60, 90), triangle('小蝴蝶结右边', 250, 110, 60, 270),
  ] },
  { title: '蘑菇家族', slots: [
    triangle('大蘑菇伞', 10, 10, 130), rectangle('大蘑菇柄', 35, 130, 80, 90),
    triangle('小蘑菇伞', 175, 55, 100), rectangle('小蘑菇柄', 190, 150, 70, 90),
    circle('小石头', 95, 210, 60), circle('大石头', 250, 210, 70),
  ] },
  { title: '亲子机器人', slots: [
    square('大机器人脑袋', 25, 25, 100), rectangle('大机器人身体', 15, 125, 120, 90),
    square('小机器人脑袋', 210, 90, 70), rectangle('小机器人身体', 205, 160, 80, 90),
    triangle('大机器人天线', 45, 0, 60, 180), triangle('小机器人天线', 215, 30, 60, 180),
  ] },
  { title: '高低滑梯', slots: [
    triangle('高滑梯', 10, 100, 150, 90), triangle('低滑梯', 195, 170, 90, 90),
    rectangle('高梯子', 30, 5, 100, 90), rectangle('低梯子', 210, 85, 70, 90),
    circle('太阳', 140, 0, 60), square('休息平台', 125, 75, 60),
  ] },
  { title: '彩虹小火车', slots: [
    rectangle('主车身', 25, 85, 140), rectangle('后车厢', 195, 140, 100),
    square('驾驶室', 80, 20, 90), circle('大车轮', 20, 195, 80),
    circle('中间小车轮', 115, 205, 60), circle('后面小车轮', 215, 220, 60),
    triangle('冒出的烟', 190, 15, 70, 90),
  ] },
  { title: '开花仙人掌', slots: [
    rectangle('仙人掌主茎', 120, 80, 90, 90), rectangle('左边枝条', 35, 80, 80, 90),
    rectangle('右边枝条', 210, 100, 70, 90), rectangle('左边连接处', 80, 135, 60),
    rectangle('右边连接处', 175, 155, 60), triangle('花盆', 115, 190, 90, 180),
    circle('顶上的花', 135, 0, 60),
  ] },
  { title: '夜航飞船', slots: [
    circle('飞船船舱', 100, 70, 120), triangle('左机翼', 10, 110, 80, 270),
    triangle('右机翼', 230, 110, 80, 90), rectangle('左起落架', 90, 195, 60, 90),
    rectangle('右起落架', 170, 195, 60, 90), circle('月亮', 20, 0, 70),
    circle('远处星球', 240, 10, 60),
  ] },
  { title: '沙滩城堡', slots: [
    square('大塔楼', 20, 135, 110), square('小塔楼', 210, 165, 80),
    triangle('大塔顶', 20, 35, 110), triangle('小塔顶', 210, 90, 80),
    rectangle('中间城墙', 130, 160, 80, 90), triangle('城堡旗子', 130, 65, 60, 90),
    circle('海贝', 140, 220, 60),
  ] },
  { title: '池塘青蛙', slots: [
    circle('青蛙身体', 110, 100, 100), circle('左眼睛', 85, 25, 70),
    circle('右眼睛', 165, 25, 70), triangle('左后腿', 20, 180, 80, 270),
    triangle('右后腿', 220, 180, 80, 90), circle('左荷叶', 10, 90, 60),
    circle('右荷叶', 250, 90, 60),
  ] },
  { title: '孔雀开屏', slots: [
    triangle('左边尾羽', 10, 15, 90, 270), triangle('中间大尾羽', 100, 0, 80),
    triangle('中间小尾羽', 185, 0, 70, 90), circle('右边尾羽', 250, 80, 60),
    circle('孔雀身体', 115, 95, 100), circle('孔雀脑袋', 205, 135, 60),
    rectangle('孔雀的脚', 210, 200, 60, 90),
  ] },
  { title: '大小热气球', slots: [
    circle('大气球', 15, 0, 120), circle('小气球', 210, 30, 80),
    rectangle('大气球绳子', 45, 110, 60, 90), rectangle('小气球绳子', 220, 105, 60, 90),
    square('大吊篮', 35, 175, 80), square('小吊篮', 220, 170, 60),
    triangle('远处的山', 125, 190, 80),
  ] },
  { title: '欢乐摩天轮', slots: [
    circle('摩天轮中心', 120, 70, 80), circle('左车厢', 20, 85, 70),
    circle('右车厢', 230, 85, 70), circle('上车厢', 130, 0, 60),
    triangle('左支架', 50, 180, 80, 270), triangle('右支架', 190, 180, 80, 90),
    rectangle('底座', 125, 200, 70),
  ] },
  { title: '工地挖掘机', slots: [
    rectangle('履带', 20, 110, 160), square('驾驶室', 40, 35, 90),
    rectangle('机器身体', 130, 80, 100), rectangle('挖掘机手臂', 215, 30, 80, 90),
    triangle('铲斗', 235, 150, 80, 90), circle('左轮子', 30, 200, 60),
    circle('右轮子', 110, 200, 70),
  ] },
  { title: '太空补给站', slots: [
    square('中央舱', 110, 80, 100), rectangle('左太阳翼', 10, 65, 80, 90),
    rectangle('右太阳翼', 230, 50, 90, 90), triangle('天线', 130, 0, 60),
    rectangle('补给舱', 125, 190, 70), circle('小星球', 20, 200, 60),
    circle('大星球', 240, 190, 80),
  ] },
  { title: '田园风车屋', slots: [
    square('风车房身', 120, 170, 80), triangle('风车屋顶', 120, 95, 80),
    triangle('左上大叶片', 40, 0, 80, 270), triangle('右上小叶片', 205, 0, 70),
    triangle('左下大叶片', 40, 80, 80, 180), triangle('右下小叶片', 205, 75, 70, 90),
    circle('路边树冠', 5, 190, 70), rectangle('路边树干', 240, 180, 60, 90),
  ] },
  { title: '小兔菜园', slots: [
    circle('大兔子的脸', 20, 65, 100), rectangle('大兔子左耳', 5, 0, 70, 90),
    rectangle('大兔子右耳', 75, 0, 70, 90), circle('小兔子的脸', 210, 100, 70),
    rectangle('小兔子左耳', 190, 35, 60, 90), rectangle('小兔子右耳', 250, 35, 60, 90),
    triangle('大萝卜', 35, 190, 80, 180), triangle('小萝卜', 215, 200, 60, 180),
  ] },
  { title: '双桅帆船', slots: [
    rectangle('大船身', 65, 90, 190), triangle('大船帆', 65, 0, 100),
    triangle('小船帆', 170, 20, 80), triangle('左旗子', 0, 20, 60, 90),
    triangle('右旗子', 260, 25, 60, 90), circle('小救生圈', 30, 210, 60),
    circle('大救生圈', 225, 205, 70), rectangle('海浪', 130, 220, 60),
  ] },
  { title: '水下机器人', slots: [
    rectangle('机器人身体', 105, 90, 110, 90), square('机器人脑袋', 120, 0, 80),
    circle('左机械手', 20, 90, 70), circle('右机械手', 240, 110, 60),
    rectangle('左脚', 90, 210, 60, 90), rectangle('右脚', 170, 210, 70, 90),
    triangle('左天线', 45, 0, 60, 270), triangle('右天线', 220, 0, 80, 90),
  ] },
  { title: '公园游乐场', slots: [
    triangle('大滑梯', 5, 120, 120, 90), triangle('小滑梯', 215, 165, 80, 90),
    rectangle('大梯子', 15, 15, 100, 90), rectangle('小梯子', 220, 80, 70, 90),
    circle('大皮球', 130, 190, 80), circle('小皮球', 130, 100, 60),
    square('休息小亭', 130, 20, 60), triangle('游乐场旗子', 230, 0, 60, 90),
  ] },
  { title: '大象和小象', slots: [
    circle('大象身体', 20, 80, 120), circle('小象身体', 205, 145, 80),
    square('大象脑袋', 140, 45, 80), square('小象脑袋', 230, 75, 60),
    rectangle('大象鼻子', 150, 120, 80, 90), rectangle('小象鼻子', 250, 200, 60, 90),
    triangle('大象尾巴', 0, 0, 80, 270), triangle('小象尾巴', 135, 200, 60, 270),
  ] },
  { title: '山顶观测站', slots: [
    triangle('大山峰', 10, 115, 140), triangle('小山峰', 205, 175, 90),
    square('观测小屋', 115, 70, 100), circle('圆屋顶', 120, 0, 90),
    rectangle('望远镜', 225, 60, 70, 90), circle('远处星星', 250, 0, 60),
    triangle('山顶旗子', 15, 10, 60, 90), rectangle('台阶', 140, 200, 60),
  ] },
  { title: '丰收农庄', slots: [
    triangle('农庄屋顶', 100, 0, 100), square('农庄房子', 110, 95, 80),
    triangle('大树树冠', 0, 55, 90), rectangle('大树树干', 15, 145, 60, 90),
    triangle('小树树冠', 245, 70, 70), rectangle('小树树干', 250, 145, 60, 90),
    circle('大南瓜', 90, 205, 70), circle('小南瓜', 180, 215, 60),
  ] },
  { title: '风雪救援车', slots: [
    rectangle('救援车车身', 50, 80, 150), square('驾驶室', 205, 85, 90),
    circle('大后轮', 50, 200, 80), circle('小前轮', 215, 210, 60),
    triangle('铲雪板', 0, 140, 60, 270), rectangle('救援梯', 75, 0, 120),
    triangle('警示灯', 215, 0, 60), circle('雪花', 0, 30, 60),
  ] },
  { title: '终点庆典', slots: [
    triangle('左边大旗', 0, 10, 90, 90), triangle('右边小旗', 250, 45, 70, 270),
    rectangle('左旗杆', 25, 95, 70, 90), rectangle('右旗杆', 255, 110, 60, 90),
    circle('大气球', 105, 0, 100), circle('小气球', 150, 105, 60),
    square('大礼物', 100, 195, 80), square('小礼物', 200, 215, 60),
  ] },
];
