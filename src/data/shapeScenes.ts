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
];
