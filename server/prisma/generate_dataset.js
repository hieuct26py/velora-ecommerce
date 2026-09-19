import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CDN_BASE = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/';

function cdn(id) {
  return `${CDN_BASE}${id}?wid=1144&hei=1144&fmt=jpeg&qlt=90`;
}

export const appleProducts100 = [
  // ==========================================
  // IPHONE (22 Sản phẩm)
  // ==========================================
  {
    name: "iPhone 15 Pro Max 256GB Titan Tự Nhiên",
    description: "Tuyệt tác titan chuẩn hàng không vũ trụ siêu nhẹ và bền bỉ kết hợp chip A17 Pro đỉnh cao. Hệ thống camera 48MP zoom quang học 5x ghi lại khoảnh khắc chuẩn điện ảnh. Thời lượng pin bứt phá cùng cổng kết nối USB-C tốc độ thần tốc.",
    price: 1199.00,
    category: "iPhone",
    images: [cdn("iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium")]
  },
  {
    name: "iPhone 15 Pro Max 512GB Titan Xanh",
    description: "Sắc xanh titan huyền bí sang trọng cùng dung lượng 512GB tha hồ lưu trữ video 4K ProRes chuyên nghiệp. Màn hình Super Retina XDR 120Hz ProMotion siêu mượt với viền mỏng kỷ lục. Trợ thủ công nghệ đẳng cấp nhất dành cho người dẫn đầu.",
    price: 1399.00,
    category: "iPhone",
    images: [cdn("iphone-15-pro-finish-select-202309-6-7inch-bluetitanium")]
  },
  {
    name: "iPhone 15 Pro Max 1TB Titan Đen",
    description: "Phiên bản dung lượng tối thượng 1TB đáp ứng mọi nhu cầu quay phim và làm việc sáng tạo chuyên nghiệp không giới hạn. Khung viền titan đen nhám nam tính chống bám vân tay tuyệt đối. Hiệu năng đồ họa Ray Tracing đưa trải nghiệm gaming lên tầm cao mới.",
    price: 1599.00,
    category: "iPhone",
    images: [cdn("iphone-15-pro-finish-select-202309-6-7inch-blacktitanium")]
  },
  {
    name: "iPhone 15 Pro 128GB Titan Trắng",
    description: "Thiết kế nhỏ gọn 6.1 inch vừa vặn hoàn hảo trong lòng bàn tay với chất liệu titan tinh xảo. Nút Action Button hoàn toàn mới mang đến khả năng tùy biến phím tắt tức thì chỉ với một chạm. Chip A17 Pro mạnh mẽ vượt trội dẫn đầu kỷ nguyên di động.",
    price: 999.00,
    category: "iPhone",
    images: [cdn("iphone-15-pro-finish-select-202309-6-7inch-whitetitanium")]
  },
  {
    name: "iPhone 15 Pro 256GB Titan Tự Nhiên",
    description: "Mẫu smartphone Pro bán chạy nhất với dung lượng 256GB tối ưu cho cả công việc lẫn giải trí thường ngày. Màn hình Dynamic Island thông minh luôn hiển thị thông báo trực quan theo thời gian thực. Camera chính 48MP bắt nét siêu sắc sảo cả ngày lẫn đêm.",
    price: 1099.00,
    category: "iPhone",
    images: [cdn("iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium")]
  },
  {
    name: "iPhone 15 Pro 512GB Titan Đen",
    description: "Vẻ đẹp lịch lãm với gam màu Titan Đen cùng dung lượng 512GB khổng lồ lưu trữ hàng ngàn ứng dụng và thước phim chất lượng cao. Khả năng kháng nước chuẩn IP68 yên tâm sử dụng trong mọi điều kiện thời tiết. Đỉnh cao công nghệ hội tụ trong chiếc điện thoại nhỏ gọn.",
    price: 1299.00,
    category: "iPhone",
    images: [cdn("iphone-15-pro-finish-select-202309-6-7inch-blacktitanium")]
  },
  {
    name: "iPhone 15 Plus 128GB Hồng Pastel",
    description: "Màn hình lớn 6.7 inch rực rỡ và thời lượng pin dẫn đầu toàn bộ thế hệ iPhone 15 cho ngày dài năng động. Mặt lưng kính pha màu gam hồng pastel thời thượng, ngọt ngào và cuốn hút mọi ánh nhìn. Dynamic Island tiện ích kết hợp camera 48MP nâng tầm ảnh chân dung.",
    price: 899.00,
    category: "iPhone",
    images: [cdn("iphone-15-finish-select-202309-6-1inch-pink")]
  },
  {
    name: "iPhone 15 Plus 256GB Xanh Lá Mạ",
    description: "Dung lượng 256GB rộng rãi thỏa sức chụp ảnh, quay video cùng màn hình Super Retina XDR hiển thị sống động. Sắc xanh lá dịu mát mang nguồn năng lượng tươi mới, thanh lịch. Cổng sạc USB-C tương thích linh hoạt với toàn bộ hệ sinh thái thiết bị Apple.",
    price: 999.00,
    category: "iPhone",
    images: [cdn("iphone-15-finish-select-202309-6-1inch-green")]
  },
  {
    name: "iPhone 15 Plus 512GB Đen Sang Trọng",
    description: "Lựa chọn màn hình lớn với bộ nhớ cực khủng 512GB cho trải nghiệm giải trí và xem phim trọn vẹn không ngắt quãng. Cấu trúc nhôm hàng không bền bỉ kết hợp mặt trước Ceramic Shield vững chãi. Pin dùng suốt 26 giờ phát video liên tục ấn tượng.",
    price: 1199.00,
    category: "iPhone",
    images: [cdn("iphone-15-finish-select-202309-6-1inch-black")]
  },
  {
    name: "iPhone 15 128GB Xanh Dương",
    description: "Thiết kế bo cong công thái học êm ái cùng sắc xanh lam trong trẻo hiện đại. Đột phá với Dynamic Island và camera 48MP chụp chi tiết siêu sắc nét kèm zoom 2x mượt mà. Chip A16 Bionic vận hành trơn tru mượt mà mọi tác vụ hàng ngày.",
    price: 799.00,
    category: "iPhone",
    images: [cdn("iphone-15-finish-select-202309-6-1inch-blue")]
  },
  {
    name: "iPhone 15 256GB Vàng Nắng",
    description: "Sắc vàng tươi sáng mang lại phong cách nổi bật tràn đầy hứng khởi mỗi ngày. Dung lượng 256GB chuẩn mực cho nhu cầu lưu trữ ảnh chụp và ứng dụng dài lâu. Tính năng phát hiện va chạm và phát hiện sự cố khẩn cấp bảo vệ an toàn cho bạn trên mọi nẻo đường.",
    price: 899.00,
    category: "iPhone",
    images: [cdn("iphone-15-finish-select-202309-6-1inch-yellow")]
  },
  {
    name: "iPhone 15 512GB Đen Tuyền",
    description: "Bộ nhớ 512GB cao cấp trong thân máy nhỏ gọn 6.1 inch cầm nắm nhẹ nhàng và linh hoạt. Mặt lưng kính nhám sang trọng không bám mồ hôi cùng cổng USB-C sạc chung dễ dàng cùng Mac và iPad. Trải nghiệm hệ điều hành iOS mượt mà và bảo mật hàng đầu.",
    price: 1099.00,
    category: "iPhone",
    images: [cdn("iphone-15-finish-select-202309-6-1inch-black")]
  },
  {
    name: "iPhone 14 Pro Max 128GB Tím Deep Purple",
    description: "Phiên bản màu tím Deep Purple huyền thoại tạo nên cơn sốt toàn cầu với vẻ đẹp ma mị đầy cuốn hút. Cụm camera chuyên nghiệp 48MP ghi lại hình ảnh sắc nét vượt trội cùng màn hình Always-on Display tiện ích. Chip A16 Bionic bứt phá sức mạnh đa nhiệm.",
    price: 1099.00,
    category: "iPhone",
    images: [cdn("iphone-14-finish-select-202209-6-1inch-purple")]
  },
  {
    name: "iPhone 14 Pro Max 256GB Vàng Gold",
    description: "Màu vàng hoàng gia quý phái kết hợp khung thép không gỉ sáng bóng tạo nên vẻ đẹp sang trọng đỉnh cao. Bộ nhớ 256GB lý tưởng lưu trữ kho tài liệu công việc và những video kỷ niệm đáng nhớ. Màn hình 120Hz ProMotion vuốt chạm phản hồi tức thì đầy mê hoặc.",
    price: 1199.00,
    category: "iPhone",
    images: [cdn("iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium")]
  },
  {
    name: "iPhone 14 Pro 128GB Đen Space Black",
    description: "Thiết kế cao cấp vừa vặn với màu đen không gian quyền lực và nam tính. Khả năng quay video Action Mode chống rung như gimbal chuyên nghiệp bắt trọn từng khoảnh khắc chuyển động. Dynamic Island thông minh biến mọi tương tác trở nên liền mạch.",
    price: 899.00,
    category: "iPhone",
    images: [cdn("iphone-15-pro-finish-select-202309-6-7inch-blacktitanium")]
  },
  {
    name: "iPhone 14 Pro 256GB Bạc Silver",
    description: "Gam màu bạc thanh tao thuần khiết kết hợp mặt lưng kính mờ nhung mịn cao cấp. Dung lượng 256GB sẵn sàng cho mọi nhu cầu chụp ảnh ProRAW chất lượng cao nguyên bản. Hiệu năng đỉnh cao đáp ứng xuất sắc công việc và giải trí không giới hạn.",
    price: 999.00,
    category: "iPhone",
    images: [cdn("iphone-15-pro-finish-select-202309-6-7inch-whitetitanium")]
  },
  {
    name: "iPhone 14 Plus 128GB Xanh Ánh Sao Starlight",
    description: "Màn hình lớn 6.7 inch với mức giá cực kỳ dễ tiếp cận cho người thích xem phim và chơi game di động. Gam màu Starlight trang nhã ấm áp cùng thời lượng pin siêu khủng giúp bạn thoải mái vi vu cả ngày dài. Hệ thống camera kép chụp đêm ấn tượng với Photonic Engine.",
    price: 799.00,
    category: "iPhone",
    images: [cdn("iphone-14-finish-select-202209-6-1inch-starlight")]
  },
  {
    name: "iPhone 14 128GB Midnight",
    description: "Sự lựa chọn thông minh với thiết kế hiện đại, bền bỉ và mức giá tối ưu cho người dùng thực dụng. Chip A15 Bionic 5 lõi GPU vẫn mạnh mẽ dư thừa cho mọi tựa game đồ họa nặng. Khả năng chụp ảnh chân dung xóa phông tự nhiên và màu sắc chân thực.",
    price: 699.00,
    category: "iPhone",
    images: [cdn("iphone-14-finish-select-202209-6-1inch-midnight")]
  },
  {
    name: "iPhone 14 256GB Xanh Blue",
    description: "Màu xanh dương tươi trẻ đậm chất tự do cùng dung lượng 256GB nhân đôi không gian lưu trữ cho bạn. Hệ thống camera kép nâng cấp thu sáng ấn tượng hơn 49% trong điều kiện thiếu sáng. Thiết kế nhẹ nhàng chỉ 172g đem lại cảm giác cầm nắm thanh thoát cả ngày.",
    price: 799.00,
    category: "iPhone",
    images: [cdn("iphone-14-finish-select-202209-6-1inch-blue")]
  },
  {
    name: "iPhone 13 128GB Midnight",
    description: "Chiếc iPhone quốc dân bền bỉ giữ vững giá trị và hiệu năng mượt mà vượt thời gian. Cụm camera đặt chéo đặc trưng với chế độ Cinematic Mode làm mờ hậu cảnh điện ảnh chuyên nghiệp. Màn hình OLED Super Retina XDR sắc nét rực rỡ dưới nắng hè.",
    price: 599.00,
    category: "iPhone",
    images: [cdn("iphone-14-finish-select-202209-6-1inch-midnight")]
  },
  {
    name: "iPhone 13 256GB Starlight",
    description: "Màu trắng ánh sao thanh khiết cùng dung lượng 256GB đáp ứng trọn vẹn nhu cầu học tập và làm việc lâu dài. Khả năng tối ưu pin xuất sắc của chip A15 Bionic cho trải nghiệm liền mạch không lo gián đoạn. Độ bền vững chãi với viền nhôm cứng cáp và kính Ceramic Shield.",
    price: 699.00,
    category: "iPhone",
    images: [cdn("iphone-14-finish-select-202209-6-1inch-starlight")]
  },
  {
    name: "iPhone 13 512GB Hồng Pink Dịu Dàng",
    description: "Sắc hồng nhẹ nhàng ngọt ngào cùng dung lượng 512GB siêu lớn hiếm có cho phân khúc phổ thông. Chụp đêm Night Mode ấn tượng trên cả 2 camera giúp bức ảnh luôn rực rỡ và giàu chi tiết. Đầu tư thông minh cho thiết bị bền bỉ và thời thượng.",
    price: 899.00,
    category: "iPhone",
    images: [cdn("iphone-15-finish-select-202309-6-1inch-pink")]
  },

  // ==========================================
  // IPAD (16 Sản phẩm)
  // ==========================================
  {
    name: "iPad Pro 13 inch M4 Ultra Retina XDR 256GB Space Black",
    description: "Đột phá công nghệ với màn hình OLED 2 lớp Tandem Ultra Retina XDR siêu mỏng chỉ 5.1mm mỏng nhất lịch sử Apple. Chip M4 thế hệ mới mang lại hiệu năng đồ họa khủng khiếp và hỗ trợ AI tốc độ cao. Trợ thủ sáng tạo tối thượng cho dân thiết kế, đồ họa và dựng phim.",
    price: 1299.00,
    category: "iPad",
    images: [cdn("ipad-pro-finish-select-202405-13inch-spaceblack")]
  },
  {
    name: "iPad Pro 13 inch M4 Ultra Retina XDR 512GB Silver",
    description: "Vẻ đẹp thuần khiết với màu bạc sang trọng cùng bộ nhớ 512GB cho các dự án sáng tạo 3D nặng đô. Độ sáng toàn màn hình 1000 nits và 1600 nits HDR đỉnh cao đem lại độ tương phản tuyệt mỹ. Tương thích hoàn hảo cùng Apple Pencil Pro và Magic Keyboard mới.",
    price: 1499.00,
    category: "iPad",
    images: [cdn("ipad-pro-finish-select-202405-11inch-silver")]
  },
  {
    name: "iPad Pro 13 inch M4 1TB Nano-texture Glass Space Black",
    description: "Mặt kính Nano-texture khắc laser độc quyền tán xạ ánh sáng giảm chói lóa tối đa trong môi trường ánh sáng phức tạp. Bộ nhớ 1TB cùng 16GB RAM hợp nhất mở ra sức mạnh xử lý không đối thủ. Cỗ máy trạm di động trong hình hài chiếc tablet siêu mỏng nhẹ.",
    price: 1899.00,
    category: "iPad",
    images: [cdn("ipad-pro-finish-select-202405-13inch-spaceblack")]
  },
  {
    name: "iPad Pro 11 inch M4 Ultra Retina XDR 256GB Space Black",
    description: "Sức mạnh chip M4 đột phá gói trọn trong kích thước 11 inch cơ động, sẵn sàng đồng hành cùng bạn trên mọi hành trình. Màn hình OLED Tandem tuyệt đỉnh tái hiện màu đen sâu thẳm và màu sắc chân thực chuẩn điện ảnh. Âm thanh 4 loa stereo sống động như trong rạp chiếu.",
    price: 999.00,
    category: "iPad",
    images: [cdn("ipad-pro-finish-select-202405-13inch-spaceblack")]
  },
  {
    name: "iPad Pro 11 inch M4 Ultra Retina XDR 512GB Silver",
    description: "Dung lượng 512GB lý tưởng cho các chuyên gia sáng tạo nội dung cần tốc độ đọc ghi dữ liệu cực nhanh. Camera 12MP quét tài liệu sắc nét tích hợp cảm biến LiDAR đo chiều sâu không gian chuẩn xác. Thời lượng pin 10 tiếng làm việc bền bỉ suốt cả ngày.",
    price: 1199.00,
    category: "iPad",
    images: [cdn("ipad-pro-finish-select-202405-11inch-silver")]
  },
  {
    name: "iPad Air 13 inch M2 Liquid Retina 128GB Blue",
    description: "Lần đầu tiên dòng iPad Air sở hữu phiên bản màn hình lớn 13 inch mở rộng không gian làm việc và đa nhiệm Split View. Chip M2 mạnh mẽ cho tốc độ xử lý nhanh hơn 50% so với thế hệ trước. Sắc xanh pastel thanh lịch kết hợp trọng lượng nhẹ dễ dàng mang theo.",
    price: 799.00,
    category: "iPad",
    images: [cdn("ipad-air-storage-select-202405-11inch-blue")]
  },
  {
    name: "iPad Air 13 inch M2 Liquid Retina 256GB Starlight",
    description: "Màu ánh sao Starlight tinh tế ấm áp với bộ nhớ 256GB nhân đôi không gian lưu trữ tài liệu và bài giảng. Camera trước góc siêu rộng đặt ở cạnh ngang mang lại góc nhìn tự nhiên hoàn hảo trong các cuộc gọi FaceTime và họp nhóm trực tuyến.",
    price: 899.00,
    category: "iPad",
    images: [cdn("ipad-air-storage-select-202405-11inch-blue")]
  },
  {
    name: "iPad Air 11 inch M2 Liquid Retina 128GB Space Gray",
    description: "Chiếc máy tính bảng đa năng toàn diện nhất cho sinh viên và giới văn phòng với chip M2 đẳng cấp. Màn hình Liquid Retina chống chói hiển thị dải màu rộng P3 sắc nét đến từng chi tiết. Hỗ trợ tính năng lướt Apple Pencil Hover tương tác chính xác tuyệt đối.",
    price: 599.00,
    category: "iPad",
    images: [cdn("ipad-pro-finish-select-202405-13inch-spaceblack")]
  },
  {
    name: "iPad Air 11 inch M2 Liquid Retina 256GB Purple",
    description: "Sắc tím mộng mơ trẻ trung cùng dung lượng 256GB cho bạn thỏa sức sáng tạo và vẽ tranh cùng Procreate suốt ngày dài. Hỗ trợ WiFi 6E siêu tốc kết nối internet mượt mà không độ trễ. Thiết kế nhôm nguyên khối tái chế 100% thân thiện với môi trường.",
    price: 699.00,
    category: "iPad",
    images: [cdn("ipad-air-storage-select-202405-11inch-blue")]
  },
  {
    name: "iPad Air 11 inch M2 Liquid Retina 512GB Blue",
    description: "Phiên bản bộ nhớ cao 512GB giúp lưu trữ toàn bộ thư viện ảnh, video và đồ án thiết kế mà không cần lo lắng về dung lượng. Kết nối Bluetooth 5.3 ổn định cùng cổng USB-C tốc độ cao mở rộng kết nối với màn hình ngoài 6K sắc nét.",
    price: 899.00,
    category: "iPad",
    images: [cdn("ipad-air-storage-select-202405-11inch-blue")]
  },
  {
    name: "iPad Gen 10 10.9 inch 64GB WiFi Blue",
    description: "Diện mạo hoàn toàn mới với thiết kế tràn viền hiện đại, 4 góc bo tròn mềm mại và màu xanh dương rực rỡ nổi bật. Màn hình 10.9 inch rộng rãi cùng chip A14 Bionic xử lý mượt mà tác vụ học tập, lướt web và xem phim. Cổng sạc USB-C tiện dụng chuẩn mực.",
    price: 349.00,
    category: "iPad",
    images: [cdn("ipad-air-storage-select-202405-11inch-blue")]
  },
  {
    name: "iPad Gen 10 10.9 inch 256GB WiFi Silver",
    description: "Màu bạc truyền thống thanh lịch cùng dung lượng 256GB thoải mái lưu trữ dữ liệu học tập suốt nhiều năm liền. Tương thích bàn phím Magic Keyboard Folio gõ êm ái và bảo vệ máy 2 mặt tiện lợi. Thiết bị thông minh lý tưởng cho mọi thành viên trong gia đình.",
    price: 499.00,
    category: "iPad",
    images: [cdn("ipad-pro-finish-select-202405-11inch-silver")]
  },
  {
    name: "iPad Gen 10 10.9 inch 64GB 5G Cellular Pink",
    description: "Khả năng kết nối mạng di động 5G siêu tốc giúp bạn làm việc, học tập và giải trí mọi lúc mọi nơi mà không phụ thuộc vào WiFi. Gam màu hồng cá tính tôn lên phong cách trẻ trung năng động. Camera trước góc siêu rộng 12MP Center Stage luôn giữ bạn ở trung tâm khung hình.",
    price: 499.00,
    category: "iPad",
    images: [cdn("iphone-15-finish-select-202309-6-1inch-pink")]
  },
  {
    name: "iPad Mini 6 8.3 inch 64GB WiFi Space Gray",
    description: "Sức mạnh siêu khủng gói gọn trong kích thước nhỏ xinh 8.3 inch cầm gọn bằng một tay cực kỳ tiện lợi. Chip A15 Bionic mạnh mẽ biến chiếc máy thành cuốn sổ tay kỹ thuật số đỉnh cao. Màn hình Liquid Retina sắc nét với True Tone bảo vệ thị lực tuyệt đối.",
    price: 499.00,
    category: "iPad",
    images: [cdn("ipad-pro-finish-select-202405-13inch-spaceblack")]
  },
  {
    name: "iPad Mini 6 8.3 inch 256GB WiFi Starlight",
    description: "Dung lượng 256GB nâng cấp tối đa khả năng lưu trữ sách, truyện, tài liệu và game đồ họa 3D yêu thích. Cảm biến vân tay Touch ID tích hợp gọn gàng ngay trên nút nguồn mở khóa tức thì. Hỗ trợ Apple Pencil 2 hít nam châm sạc không dây tiện ích.",
    price: 649.00,
    category: "iPad",
    images: [cdn("ipad-pro-finish-select-202405-11inch-silver")]
  },
  {
    name: "iPad Mini 6 8.3 inch 256GB 5G Cellular Purple",
    description: "Phiên bản đỉnh nhất dòng iPad Mini tích hợp cả kết nối 5G tốc độ cao và dung lượng 256GB trong sắc tím sang trọng. Bất kể trên máy bay, tàu xe hay quán cà phê, bạn luôn sẵn sàng ghi chú và xử lý công việc thần tốc. Trải nghiệm di động không giới hạn.",
    price: 799.00,
    category: "iPad",
    images: [cdn("ipad-air-storage-select-202405-11inch-blue")]
  },

  // ==========================================
  // MAC (16 Sản phẩm)
  // ==========================================
  {
    name: "MacBook Air 13 inch M3 16GB 256GB Midnight",
    description: "Chiếc máy tính xách tay mỏng nhẹ phổ biến nhất thế giới nay trang bị chip M3 nâng cấp với khả năng hỗ trợ 2 màn hình ngoài. Lớp phủ anodize cải tiến trên màu Midnight huyền bí giúp giảm bám dấu vân tay tối ưu. Pin 18 tiếng bền bỉ cho cả ngày làm việc không cần mang theo củ sạc.",
    price: 1099.00,
    category: "Mac",
    images: [cdn("mba13-midnight-select-202402")]
  },
  {
    name: "MacBook Air 13 inch M3 16GB 512GB Starlight",
    description: "Sự kết hợp hoàn hảo giữa 16GB RAM đa nhiệm mượt mà và 512GB SSD tốc độ cao trong sắc vàng ánh sao Starlight quý phái. Màn hình Liquid Retina 13.6 inch rực rỡ với 500 nits độ sáng hỗ trợ 1 tỷ màu. Thiết kế không quạt tản nhiệt mang lại sự tĩnh lặng tuyệt đối khi làm việc.",
    price: 1299.00,
    category: "Mac",
    images: [cdn("mba13-midnight-select-202402")]
  },
  {
    name: "MacBook Air 13 inch M3 24GB 512GB Space Gray",
    description: "Cấu hình RAM tối đa 24GB đáp ứng nhu cầu lập trình, mở hàng chục tab trình duyệt và chạy các mô hình AI trực tiếp trên máy. Trọng lượng siêu nhẹ chỉ 1.24kg đồng hành cùng bạn đến bất cứ đâu. Bàn phím Magic Keyboard gõ êm với hàng phím chức năng đầy đủ.",
    price: 1499.00,
    category: "Mac",
    images: [cdn("mba13-midnight-select-202402")]
  },
  {
    name: "MacBook Air 15 inch M3 16GB 256GB Midnight",
    description: "Không gian làm việc rộng rãi trên màn hình 15.3 inch Liquid Retina sắc nét mà vẫn duy trì độ mỏng đáng kinh ngạc chỉ 11.5mm. Hệ thống âm thanh 6 loa với công nghệ khử lực mang lại âm bass sâu lắng và âm vòm Spatial Audio sống động. Lựa chọn số 1 cho người cần màn lớn cơ động.",
    price: 1299.00,
    category: "Mac",
    images: [cdn("mba15-midnight-select-202306")]
  },
  {
    name: "MacBook Air 15 inch M3 16GB 512GB Silver",
    description: "Gam màu bạc truyền thống thanh lịch cùng 512GB dung lượng lưu trữ phục vụ trọn vẹn nhu cầu đồ họa và phân tích dữ liệu. Camera FaceTime HD 1080p cùng 3 micro chất lượng phòng thu cho hình ảnh và giọng nói trong trẻo trong mọi cuộc họp. Trải nghiệm làm việc thăng hoa.",
    price: 1499.00,
    category: "Mac",
    images: [cdn("mba15-midnight-select-202306")]
  },
  {
    name: "MacBook Air 15 inch M3 24GB 1TB Space Gray",
    description: "Cấu hình đỉnh cao nhất dòng Air với 24GB RAM và 1TB SSD khổng lồ giải quyết gọn gàng mọi deadline dự án phức tạp. Chip M3 tích hợp Dynamic Caching và dò tia phần cứng mang lại hiệu năng gaming và render 3D vượt trội. Hoàn hảo từ thiết kế đến hiệu suất.",
    price: 1899.00,
    category: "Mac",
    images: [cdn("mba15-midnight-select-202306")]
  },
  {
    name: "MacBook Pro 14 inch M3 16GB 512GB Space Gray",
    description: "Dòng Pro chuẩn mực với màn hình Liquid Retina XDR công nghệ Mini-LED 120Hz ProMotion có độ sáng HDR lên tới 1600 nits. Đầy đủ các cổng kết nối chuyên nghiệp: HDMI, đầu đọc thẻ SDXC, cổng sạc MagSafe 3 và 2 cổng Thunderbolt. Hiệu năng Pro trong thân máy gọn gàng.",
    price: 1599.00,
    category: "Mac",
    images: [cdn("mbp14-spacegray-select-202310")]
  },
  {
    name: "MacBook Pro 14 inch M3 Pro 18GB 512GB Space Black",
    description: "Tông màu Đen Không Gian Space Black đột phá với công nghệ chống bám vân tay độc quyền mang đến phong thái chuyên nghiệp đỉnh cao. Chip M3 Pro với 11-Core CPU và 14-Core GPU xử lý mượt mà video 8K đa luồng. Thời lượng pin kỷ lục lên đến 22 giờ liên tục.",
    price: 1999.00,
    category: "Mac",
    images: [cdn("mbp14-spacegray-select-202310")]
  },
  {
    name: "MacBook Pro 14 inch M3 Pro 18GB 1TB Silver",
    description: "Bộ nhớ 1TB siêu tốc cùng sắc bạc sang trọng phù hợp cho các nhiếp ảnh gia và kỹ sư lập trình phần mềm chuyên nghiệp. Tản nhiệt thông minh vận hành êm ái giữ cho máy luôn mát mẻ và duy trì hiệu năng tối đa khi tải nặng. Chiếc laptop hoàn mỹ không tì vết.",
    price: 2399.00,
    category: "Mac",
    images: [cdn("mbp14-spacegray-select-202310")]
  },
  {
    name: "MacBook Pro 14 inch M3 Max 36GB 1TB Space Black",
    description: "Sức mạnh quái vật của chip M3 Max với 14-Core CPU và 30-Core GPU mang lại khả năng dựng hình 3D và render hiệu ứng kỹ xảo trong chớp mắt. 36GB RAM băng thông bộ nhớ 300GB/s xử lý mượt mà các tập dữ liệu AI khổng lồ. Vũ khí tối thượng của các studio hàng đầu.",
    price: 3199.00,
    category: "Mac",
    images: [cdn("mbp14-spacegray-select-202310")]
  },
  {
    name: "MacBook Pro 16 inch M3 Pro 18GB 512GB Space Black",
    description: "Màn hình 16.2 inch Liquid Retina XDR choáng ngợp với độ phân giải siêu nét mang lại không gian sáng tạo không giới hạn. Chip M3 Pro vận hành hoàn hảo các phần mềm đồ họa DaVinci Resolve, Final Cut Pro và Adobe Premiere. Thời lượng pin ấn tượng nhất từng có trên máy tính xách tay Mac.",
    price: 2499.00,
    category: "Mac",
    images: [cdn("mbp16-spaceblack-select-202310")]
  },
  {
    name: "MacBook Pro 16 inch M3 Pro 36GB 512GB Silver",
    description: "Cấu hình 36GB RAM hợp nhất giúp chạy mượt mà nhiều máy ảo và tác vụ lập trình biên dịch mã nguồn phức tạp song song. Màu bạc truyền thống toát lên vẻ đẹp tinh xảo, bền vững theo năm tháng. Hệ thống 6 loa âm thanh vòm đẳng cấp phòng thu chuyên nghiệp.",
    price: 2899.00,
    category: "Mac",
    images: [cdn("mbp16-spaceblack-select-202310")]
  },
  {
    name: "MacBook Pro 16 inch M3 Max 48GB 1TB Space Black",
    description: "Đỉnh cao tuyệt đối của máy tính xách tay với chip M3 Max 16-Core CPU, 40-Core GPU và 48GB RAM thống nhất siêu tốc. Render video 8K ProRes thời gian thực và xử lý đồ họa điện ảnh chuẩn Hollywood mà không hề gặp độ trễ. Thiết bị mơ ước của mọi nhà sáng tạo nội dung.",
    price: 3999.00,
    category: "Mac",
    images: [cdn("mbp16-spaceblack-select-202310")]
  },
  {
    name: "Mac mini M2 8-Core CPU 10-Core GPU 8GB 256GB",
    description: "Cỗ máy để bàn mini nhỏ gọn nhưng mang sức mạnh phi thường của chip M2 với mức giá khởi điểm vô cùng hấp dẫn. Dễ dàng biến mọi bàn làm việc thành không gian công nghệ chuyên nghiệp khi kết nối cùng màn hình và chuột phím. Tiết kiệm điện năng tối đa và vận hành êm ái.",
    price: 599.00,
    category: "Mac",
    images: [cdn("mac-mini-202301-gallery-1")]
  },
  {
    name: "Mac mini M2 Pro 10-Core CPU 16-Core GPU 16GB 512GB",
    description: "Nâng cấp vượt bậc với chip M2 Pro chuyên nghiệp hỗ trợ xuất tới 3 màn hình ngoài cùng lúc và 4 cổng Thunderbolt 4 tốc độ cao. 16GB RAM và 512GB SSD xử lý nhanh chóng các file thiết kế nặng và lập trình ứng dụng. Sức mạnh workstation trong thiết kế hộp nhôm nhỏ gọn.",
    price: 1299.00,
    category: "Mac",
    images: [cdn("mac-mini-202301-gallery-1")]
  },
  {
    name: "Mac Studio M2 Max 12-Core CPU 30-Core GPU 32GB 512GB",
    description: "Cỗ máy trạm chuyên nghiệp nhỏ gọn dành cho các studio âm nhạc, đồ họa kiến trúc và dựng phim cao cấp. Trang bị hệ thống tản nhiệt tiên tiến giữ cho chip M2 Max luôn bùng nổ hiệu năng bền bỉ trong những phiên làm việc kéo dài. Kết nối vô tận với 12 cổng giao tiếp hiệu năng cao.",
    price: 1999.00,
    category: "Mac",
    images: [cdn("mac-studio-select-202306")]
  },

  // ==========================================
  // WATCH (15 Sản phẩm)
  // ==========================================
  {
    name: "Apple Watch Ultra 2 GPS + Cellular 49mm Titanium Dây Alpine Cam",
    description: "Chiếc đồng hồ thông minh thám hiểm bền bỉ nhất với vỏ titan 49mm chuẩn hàng không vũ trụ và mặt kính sapphire chống trầy xước. Màn hình sáng nhất lịch sử 3000 nits hiển thị rõ nét dưới ánh nắng gắt sa mạc. Định vị GPS tần số kép chính xác tối đa và pin dùng tới 72 giờ ở chế độ nguồn điện thấp.",
    price: 799.00,
    category: "Watch",
    images: [cdn("watch-card-40-ultra2-202309")]
  },
  {
    name: "Apple Watch Ultra 2 GPS + Cellular 49mm Titanium Dây Trail Vàng Be",
    description: "Dây Trail Loop siêu nhẹ, mềm mại và co giãn tối ưu cho các vận động viên chạy marathon và người tập luyện sức bền. Tích hợp còi báo động khẩn cấp 86 decibel phát âm xa tới 180 mét và độ sâu chống nước 100m. Đồng hành kiên cường chinh phục mọi giới hạn bản thân.",
    price: 799.00,
    category: "Watch",
    images: [cdn("watch-card-40-ultra2-202309")]
  },
  {
    name: "Apple Watch Ultra 2 GPS + Cellular 49mm Titanium Dây Ocean Xanh Biển",
    description: "Thiết kế dây Ocean cao su đúc chuyên dụng cho các môn thể thao mạo hiểm dưới nước và lặn biển chuyên nghiệp tới độ sâu 40m. Tích hợp máy đo độ sâu và cảm biến nhiệt độ nước tự động kích hoạt. Biểu tượng phong cách phiêu lưu đẳng cấp của người đàn ông hiện đại.",
    price: 799.00,
    category: "Watch",
    images: [cdn("watch-card-40-ultra2-202309")]
  },
  {
    name: "Apple Watch Series 9 GPS 45mm Nhôm Midnight Dây Thể Thao",
    description: "Đột phá với thao tác Chạm Hai Lần (Double Tap) kỳ diệu điều khiển cuộc gọi và phát nhạc mà không cần chạm vào màn hình. Chip S9 SiP mạnh mẽ cùng màn hình sáng gấp đôi 2000 nits hiển thị rực rỡ ngoài trời. Trợ lý sức khỏe theo dõi điện tâm đồ ECG và nồng độ oxy trong máu SpO2 sát sao.",
    price: 429.00,
    category: "Watch",
    images: [cdn("watch-card-40-s9-202309")]
  },
  {
    name: "Apple Watch Series 9 GPS 45mm Nhôm Starlight Dây Thể Thao",
    description: "Sắc màu ánh sao Starlight thanh lịch hòa quyện tinh tế với mọi phong cách thời trang từ công sở đến thể thao. Tính năng Tìm Chính Xác (Precision Finding) cho iPhone giúp bạn tìm điện thoại trong nháy mắt. Theo dõi chu kỳ giấc ngủ chuyên sâu giúp bạn cải thiện sức khỏe toàn diện.",
    price: 429.00,
    category: "Watch",
    images: [cdn("watch-card-40-s9-202309")]
  },
  {
    name: "Apple Watch Series 9 GPS 45mm Nhôm Silver Dây Thể Thao",
    description: "Gam màu bạc cổ điển trẻ trung với mặt đồng hồ 45mm sắc nét hiển thị trọn vẹn thông báo và chỉ số vận động thể thao. Tính năng phát hiện va chạm xe và phát hiện ngã tự động kết nối cấp cứu khi xảy ra sự cố. Thiết bị đeo tay thiết yếu cho lối sống năng động và an toàn.",
    price: 429.00,
    category: "Watch",
    images: [cdn("watch-card-40-s9-202309")]
  },
  {
    name: "Apple Watch Series 9 GPS 41mm Nhôm Pink Dây Thể Thao",
    description: "Sắc hồng pastel ngọt ngào quyến rũ trên cổ tay phái đẹp với kích thước 41mm nhỏ nhắn vừa vặn tuyệt đối. Cảm biến đo nhiệt độ cơ thể hỗ trợ theo dõi sức khỏe chuyên sâu của phụ nữ. Hàng chục chế độ tập luyện từ Yoga, Pilates đến bơi lội đồng hành cùng bạn mỗi ngày.",
    price: 399.00,
    category: "Watch",
    images: [cdn("watch-card-40-s9-202309")]
  },
  {
    name: "Apple Watch Series 9 GPS 41mm Nhôm Starlight Dây Thể Thao",
    description: "Thiết kế nhôm tái chế trung hòa carbon thân thiện với môi trường kết hợp mặt kính cong thanh thoát. Chip Ultra Wideband thế hệ 2 mang lại khả năng định vị siêu nhạy. Trải nghiệm sống thông minh hơn khi nghe nhận tin nhắn và cuộc gọi ngay trên cổ tay.",
    price: 399.00,
    category: "Watch",
    images: [cdn("watch-card-40-s9-202309")]
  },
  {
    name: "Apple Watch Series 9 GPS + Cellular 45mm Thép Không Gỉ Graphite Dây Milanese",
    description: "Vỏ thép không gỉ mạ PVD màu than chì bóng bẩy kết hợp dây kim loại đan Milanese từ tính sang trọng chuẩn phong cách doanh nhân. Mặt kính sapphire cao cấp chống trầy xước gần như tuyệt đối. Hỗ trợ eSIM độc lập cho phép đàm thoại và kết nối 4G không cần mang theo điện thoại.",
    price: 749.00,
    category: "Watch",
    images: [cdn("watch-card-40-s9-202309")]
  },
  {
    name: "Apple Watch Series 9 GPS + Cellular 41mm Thép Không Gỉ Vàng Gold Dây Milanese",
    description: "Chiếc trang sức công nghệ lộng lẫy với ánh vàng kim quý phái tôn vinh cổ tay phái đẹp trong mọi buổi dạ tiệc. Tự do nghe nhạc trực tuyến, trả lời tin nhắn và nhận thông báo mọi lúc mọi nơi nhờ kết nối mạng di động độc lập. Đẳng cấp thời thượng song hành cùng công nghệ bảo vệ sức khỏe.",
    price: 699.00,
    category: "Watch",
    images: [cdn("watch-card-40-s9-202309")]
  },
  {
    name: "Apple Watch Series 8 GPS 45mm Nhôm Midnight",
    description: "Mẫu đồng hồ thông minh kinh điển sở hữu đầy đủ cảm biến đo điện tâm đồ, nồng độ oxy trong máu và theo dõi nhiệt độ. Thời lượng pin 18 giờ bền bỉ hỗ trợ chế độ tiết kiệm pin Low Power Mode lên tới 36 giờ. Người bạn đồng hành tin cậy chăm sóc sức khỏe mỗi ngày.",
    price: 379.00,
    category: "Watch",
    images: [cdn("watch-card-40-s9-202309")]
  },
  {
    name: "Apple Watch Series 8 GPS 41mm Nhôm Starlight",
    description: "Kích thước 41mm thanh mảnh ôm sát cổ tay mang lại sự êm ái khi đeo cả ngày lẫn trong lúc ngủ. Khả năng chống bụi chuẩn IP6X và chống nước ở độ sâu 50 mét thỏa sức bơi lội. Màn hình Retina luôn bật hiển thị thời gian rõ ràng mà không cần lắc cổ tay.",
    price: 349.00,
    category: "Watch",
    images: [cdn("watch-card-40-s9-202309")]
  },
  {
    name: "Apple Watch SE 2 GPS 44mm Nhôm Midnight Dây Thể Thao",
    description: "Giá trị tuyệt vời với mức giá dễ tiếp cận nhưng sở hữu chip S8 mạnh mẽ ngang ngửa dòng Series 8 cao cấp. Theo dõi nhịp tim thông minh, cảnh báo nhịp tim cao/thấp và phát hiện té ngã bảo vệ người dùng mọi lúc. Mặt lưng sợi nylon tổng hợp nhẹ nhàng và êm ái.",
    price: 279.00,
    category: "Watch",
    images: [cdn("watch-card-40-se-202309")]
  },
  {
    name: "Apple Watch SE 2 GPS 44mm Nhôm Starlight Dây Thể Thao",
    description: "Màu sắc thanh nhã phù hợp cho cả nam và nữ cùng màn hình Retina rộng rãi dễ dàng đọc tin nhắn khi đang chạy bộ. Ứng dụng Bài tập nâng cao phân tích chi tiết vùng nhịp tim và chiều dài sải bước. Chiếc Apple Watch thông minh khởi đầu hoàn hảo cho mọi lứa tuổi.",
    price: 279.00,
    category: "Watch",
    images: [cdn("watch-card-40-se-202309")]
  },
  {
    name: "Apple Watch SE 2 GPS 40mm Nhôm Silver Dây Thể Thao",
    description: "Chiếc smartwatch nhỏ gọn nhất của Apple mang lại sự thoải mái tuyệt đối cho cổ tay thanh mảnh khi tập luyện cả ngày. Theo dõi các giai đoạn giấc ngủ REM, Core và Deep để bạn hiểu rõ chất lượng nghỉ ngơi. Kết nối liền mạch cùng hệ sinh thái iPhone cực kỳ tiện lợi.",
    price: 249.00,
    category: "Watch",
    images: [cdn("watch-card-40-se-202309")]
  },

  // ==========================================
  // ÂM THANH (15 Sản phẩm)
  // ==========================================
  {
    name: "Tai nghe AirPods Pro 2 Hộp sạc MagSafe USB-C",
    description: "Đỉnh cao chống ồn chủ động ANC gấp 2 lần thế hệ trước cùng chip Apple H2 tái tạo âm thanh trung thực chi tiết đến ngỡ ngàng. Tính năng Âm thanh Thích ứng (Adaptive Audio) tự động điều chỉnh độ chống ồn thông minh theo môi trường xung quanh. Hộp sạc tích hợp loa tìm kiếm và cổng sạc USB-C hiện đại.",
    price: 249.00,
    category: "Âm thanh",
    images: [cdn("airpods-pro-2-hero-select-202409")]
  },
  {
    name: "Tai nghe AirPods Pro 2 Chống ồn chủ động ANC Lightning",
    description: "Trải nghiệm âm thanh không gian cá nhân hóa (Spatial Audio) theo dõi chuyển động đầu sống động như bạn đang ngồi giữa khán phòng hòa nhạc. Thời lượng pin nghe liên tục lên đến 6 giờ và tổng cộng 30 giờ khi kèm hộp sạc. Khả năng kháng bụi và nước chuẩn IP54 bền bỉ trong mọi buổi tập.",
    price: 249.00,
    category: "Âm thanh",
    images: [cdn("airpods-pro-2-hero-select-202409")]
  },
  {
    name: "Tai nghe AirPods 4 Bản Tiêu Chuẩn",
    description: "Thiết kế công thái học hoàn toàn mới được nghiên cứu trên hàng ngàn khuôn tai đem lại sự vừa vặn và êm ái tuyệt đối suốt cả ngày. Chip H2 nâng cấp chất lượng đàm thoại trong trẻo với tính năng Tách Giọng Nói (Voice Isolation). Hộp sạc nhỏ gọn nhất từng có sạc qua cổng USB-C.",
    price: 129.00,
    category: "Âm thanh",
    images: [cdn("MME73")]
  },
  {
    name: "Tai nghe AirPods 4 Bản Chống ồn chủ động ANC",
    description: "Lần đầu tiên dòng AirPods thiết kế mở tích hợp công nghệ Chống ồn chủ động ANC và chế độ Xuyên âm thông minh. Tự động giảm âm lượng khi bạn bắt đầu trò chuyện với người xung quanh nhờ Nhận biết hội thoại. Hộp sạc hỗ trợ sạc không dây với bộ sạc Apple Watch tiện lợi.",
    price: 179.00,
    category: "Âm thanh",
    images: [cdn("MME73")]
  },
  {
    name: "Tai nghe AirPods 3 Hộp sạc MagSafe",
    description: "Thiết kế cuống tai ngắn năng động với cảm biến lực điều khiển phát nhạc và nhận cuộc gọi cực nhạy. Hỗ trợ sạc không dây nam châm MagSafe hít chặt chuẩn xác vào đế sạc không lo rơi trượt. Âm bass nội lực đầy phấn khích cùng công nghệ Adaptive EQ tự cân chỉnh âm thanh.",
    price: 179.00,
    category: "Âm thanh",
    images: [cdn("MME73")]
  },
  {
    name: "Tai nghe AirPods 3 Hộp sạc Lightning",
    description: "Lựa chọn tai nghe không dây bán chạy nhất với thời lượng pin nghe nhạc lên đến 30 giờ đồng hành bền bỉ. Khả năng kháng mồ hôi và nước chuẩn IPX4 cho bạn an tâm tập luyện thể thao cường độ cao. Tự động chuyển đổi mượt mà giữa iPhone, iPad và Mac trong tích tắc.",
    price: 169.00,
    category: "Âm thanh",
    images: [cdn("MME73")]
  },
  {
    name: "Tai nghe chụp tai AirPods Max Bạc Silver",
    description: "Tuyệt tác tai nghe over-ear cao cấp với khung nhôm anodize sang trọng và quai đeo lưới đan thoáng khí giảm áp lực lên đỉnh đầu. Trình điều khiển động do Apple thiết kế mang đến dải âm trung rõ nét và âm trầm sâu lắng với độ méo cực thấp. Núm xoay Digital Crown điều chỉnh âm lượng chính xác như trên đồng hồ cơ.",
    price: 549.00,
    category: "Âm thanh",
    images: [cdn("airpods-max-select-silver-202011")]
  },
  {
    name: "Tai nghe chụp tai AirPods Max Xám Space Gray",
    description: "Gam màu xám không gian đậm chất studio chuyên nghiệp cùng khả năng chống ồn chủ động hàng đầu ngành công nghiệp âm thanh. Hai chip Apple H1 tính toán xử lý 9 tỷ thao tác mỗi giây mang lại trải nghiệm âm thanh chân thực từng nhịp thở. Chế độ Transparent Mode nghe rõ âm thanh môi trường chỉ với một chạm.",
    price: 549.00,
    category: "Âm thanh",
    images: [cdn("airpods-max-select-spacegray-202011")]
  },
  {
    name: "Tai nghe chụp tai AirPods Max Hồng Pink",
    description: "Sắc hồng pastel ngọt ngào thời thượng biến chiếc tai nghe thành phụ kiện thời trang sành điệu của các tín đồ âm nhạc. Đệm tai bọc vải dệt êm ái cách âm tuyệt hảo giúp bạn đắm chìm vào thế giới giai điệu yêu thích. Thời lượng pin 20 giờ liên tục kể cả khi bật chống ồn và Spatial Audio.",
    price: 549.00,
    category: "Âm thanh",
    images: [cdn("airpods-max-select-pink-202011")]
  },
  {
    name: "Tai nghe chụp tai AirPods Max Xanh Da Trời Sky Blue",
    description: "Màu xanh da trời thanh lịch mang lại cảm giác thư thái và phong cách hiện đại khác biệt giữa đám đông. Công nghệ Âm thanh Không gian cá nhân hóa tái hiện không gian biểu diễn đa chiều như tại rạp hát. Đi kèm bao Smart Case thông minh đưa tai nghe vào chế độ siêu tiết kiệm pin.",
    price: 549.00,
    category: "Âm thanh",
    images: [cdn("airpods-max-select-skyblue-202011")]
  },
  {
    name: "Tai nghe chụp tai AirPods Max Xanh Lá Green",
    description: "Phiên bản màu xanh lá cây độc đáo mang hơi thở thiên nhiên tươi mới với chất liệu hoàn thiện cao cấp chuẩn hàng không. Khả năng kết nối Bluetooth 5.0 truyền tải âm thanh ổn định khoảng cách xa không giật lag. Sự lựa chọn hoàn hảo cho những đôi tai khắt khe nhất.",
    price: 549.00,
    category: "Âm thanh",
    images: [cdn("airpods-max-select-green-202011")]
  },
  {
    name: "Loa thông minh HomePod mini Xám Space Gray",
    description: "Thân hình nhỏ gọn chỉ 8.4cm nhưng mang lại âm thanh 360 độ ngập tràn căn phòng với âm trầm uy lực đáng kinh ngạc. Trợ lý ảo Siri điều khiển nhà thông minh Apple HomeKit mượt mà và trả lời mọi thắc mắc của bạn tức thì. Dễ dàng ghép đôi 2 loa để tạo dàn âm thanh stereo sống động.",
    price: 99.00,
    category: "Âm thanh",
    images: [cdn("homepod-mini-select-spacegray-202110")]
  },
  {
    name: "Loa thông minh HomePod mini Trắng White",
    description: "Thiết kế vải lưới liền mạch màu trắng tinh tế hòa hợp hoàn hảo với mọi không gian nội thất phòng khách hay bàn làm việc. Tính năng Intercom cho phép truyền thông điệp giọng nói qua lại giữa các phòng trong nhà nhanh chóng. Đưa âm nhạc và trải nghiệm nhà thông minh đến gần bạn hơn.",
    price: 99.00,
    category: "Âm thanh",
    images: [cdn("homepod-mini-select-white-202110")]
  },
  {
    name: "Loa thông minh HomePod mini Xanh Dương Blue",
    description: "Gam màu xanh đại dương mát mắt tạo điểm nhấn ấn tượng cho góc làm việc cá nhân của bạn. Chỉ cần chạm nhẹ iPhone vào đỉnh loa để chuyển tiếp bài hát đang nghe liền mạch không chút gián đoạn. Tận hưởng kho nhạc hàng chục triệu bài hát chất lượng lossless từ Apple Music.",
    price: 99.00,
    category: "Âm thanh",
    images: [cdn("homepod-mini-select-blue-202110")]
  },
  {
    name: "Loa thông minh HomePod mini Vàng Yellow",
    description: "Sắc vàng nổi bật lan tỏa năng lượng tích cực và giai điệu sống động đến mọi ngóc ngách trong ngôi nhà bạn. 4 micro thu âm trường xa giúp Siri nhận lệnh chuẩn xác ngay cả khi loa đang phát nhạc lớn. Trung tâm điều khiển nhà thông minh hiện đại và đáng yêu.",
    price: 99.00,
    category: "Âm thanh",
    images: [cdn("homepod-mini-select-yellow-202110")]
  },

  // ==========================================
  // PHỤ KIỆN (16 Sản phẩm)
  // ==========================================
  {
    name: "Bút cảm ứng Apple Pencil Pro",
    description: "Công cụ sáng tạo ma thuật mới nhất với cảm biến bóp (Squeeze) mở nhanh bảng màu và xoay thân bút (Barrel Roll) đổi góc nét vẽ tức thì. Phản hồi xúc giác Haptic Engine rung nhẹ chân thực cùng tính năng Tìm Kiếm Find My định vị khi thất lạc. Chuẩn mực tối thượng cho họa sĩ kỹ thuật số.",
    price: 129.00,
    category: "Phụ kiện",
    images: [cdn("MU8F2")]
  },
  {
    name: "Bút cảm ứng Apple Pencil 2",
    description: "Thiết kế vát cạnh nam châm hít chặt tự động sạc không dây trực tiếp trên cạnh iPad cực kỳ tiện lợi. Độ trễ cực thấp tính bằng mili giây đem lại cảm giác viết vẽ chân thực như bút chì lướt trên giấy. Chạm đúp hai lần trên thân bút để đổi nhanh giữa bút chì và tẩy xóa.",
    price: 129.00,
    category: "Phụ kiện",
    images: [cdn("MU8F2")]
  },
  {
    name: "Bút cảm ứng Apple Pencil USB-C",
    description: "Lựa chọn tiết kiệm hoàn hảo cho học sinh sinh viên ghi chú bài giảng và ký tài liệu điện tử hàng ngày. Nắp trượt thông minh để lộ cổng sạc USB-C kết nối và sạc pin nhanh chóng. Cảm ứng nghiêng tạo bóng và hỗ trợ lướt bút Hover trên màn hình iPad sắc nét.",
    price: 79.00,
    category: "Phụ kiện",
    images: [cdn("MU8F2")]
  },
  {
    name: "Bàn phím Magic Keyboard cho iPad Pro 13 inch M4 Đen",
    description: "Thiết kế nhôm nguyên khối sang trọng với hàng 14 phím chức năng tiện ích và trackpad kính cảm ứng rung phản hồi chân thực. Thiết kế lơ lửng điều chỉnh góc nhìn mượt mà biến iPad Pro thành một chiếc máy tính xách tay thực thụ. Cổng USB-C pass-through sạc pin tiện lợi.",
    price: 349.00,
    category: "Phụ kiện",
    images: [cdn("MXQT2")]
  },
  {
    name: "Bàn phím Magic Keyboard cho iPad Pro 11 inch M4 Trắng",
    description: "Màu trắng tinh khôi thanh tao với phím cắt kéo hành trình 1mm êm ái và đèn nền phím tự động điều chỉnh theo ánh sáng môi trường. Bảo vệ hoàn hảo cả mặt trước và mặt sau cho chiếc iPad Pro đắt giá của bạn khi gập lại. Trải nghiệm soạn thảo văn bản đỉnh cao.",
    price: 299.00,
    category: "Phụ kiện",
    images: [cdn("MXQT2")]
  },
  {
    name: "Bàn phím Magic Keyboard cho iPad Air 11 inch Đen",
    description: "Trợ thủ đắc lực nâng cấp iPad Air thành cỗ máy làm việc hiệu quả với bàn phím có đèn nền và bàn di chuột nhạy bén. Bản lề nam châm hít giữ máy vững chãi trên bàn hay ngay trên đùi khi di chuyển. Mở ra là làm việc, gập lại là chiếc bao da bảo vệ an toàn.",
    price: 299.00,
    category: "Phụ kiện",
    images: [cdn("MXQT2")]
  },
  {
    name: "Bàn phím Magic Keyboard tích hợp Touch ID và Bàn phím số",
    description: "Mở khóa máy Mac và xác thực thanh toán Apple Pay chỉ với một chạm ngón tay bảo mật tuyệt đối qua Touch ID. Bố cục đầy đủ với các phím điều hướng tài liệu nhanh và cụm bàn phím số chuyên dụng cho dân kế toán tài chính. Pin sạc tích hợp sử dụng liên tục khoảng một tháng.",
    price: 199.00,
    category: "Phụ kiện",
    images: [cdn("MK2A3")]
  },
  {
    name: "Chuột không dây Apple Magic Mouse Bạc Trắng",
    description: "Thiết kế không dây mượt mà với bề mặt đa chạm Multi-Touch cho phép bạn cuộn trang, lướt qua tài liệu và chuyển đổi ứng dụng chỉ bằng cử chỉ lướt ngón tay. Chân đế tối ưu lướt êm ái trên mọi mặt phẳng bàn làm việc. Tự động kết nối tức thì với máy Mac ngay khi mở hộp.",
    price: 79.00,
    category: "Phụ kiện",
    images: [cdn("MK2E3")]
  },
  {
    name: "Bàn di chuột Apple Magic Trackpad Bạc Trắng",
    description: "Bề mặt kính rộng tràn viền tích hợp công nghệ cảm ứng lực Force Touch nhận diện độ sâu của lực nhấn mang lại phản hồi chân thực. Hỗ trợ trọn vẹn mọi thao tác cử chỉ tay của macOS giúp bạn kiểm soát công việc trực quan và tự nhiên hơn bao giờ hết.",
    price: 129.00,
    category: "Phụ kiện",
    images: [cdn("MM6F3")]
  },
  {
    name: "Đế sạc không dây Apple MagSafe Charger 15W",
    description: "Nam châm tích hợp tự động căn chỉnh hoàn hảo hít chặt vào mặt lưng iPhone 12 trở lên giúp sạc không dây nhanh lên đến 15W. Tương thích chuẩn sạc Qi giúp bạn có thể sạc tiện lợi cho cả AirPods và các thiết bị hỗ trợ khác. Thiết kế nhôm mỏng nhẹ sang trọng và tinh tế.",
    price: 39.00,
    category: "Phụ kiện",
    images: [cdn("MHXH3")]
  },
  {
    name: "Củ sạc nhanh Apple 20W USB-C Power Adapter",
    description: "Củ sạc chính hãng Apple cung cấp khả năng sạc nhanh hiệu quả 50% pin chỉ trong vòng 30 phút cho iPhone 15 và iPhone 14. Thiết kế chân cắm chuẩn quốc tế chắc chắn, an toàn chống cháy nổ và bảo vệ tuổi thọ pin thiết bị tối đa. Nhỏ gọn dễ dàng bỏ túi đi muôn nơi.",
    price: 19.00,
    category: "Phụ kiện",
    images: [cdn("MHJE3")]
  },
  {
    name: "Củ sạc đôi Apple 35W Dual USB-C Port Compact",
    description: "Thiết kế nhỏ gọn với 2 cổng USB-C thông minh cho phép bạn sạc đồng thời cả iPhone và Apple Watch hoặc MacBook Air cùng lúc. Chân cắm gập gọn gàng tiện lợi khi mang theo du lịch hay công tác xa. Công nghệ phân phối điện năng thông minh bảo vệ an toàn cho thiết bị.",
    price: 59.00,
    category: "Phụ kiện",
    images: [cdn("MM0A3")]
  },
  {
    name: "Pin dự phòng không dây Apple MagSafe Battery Pack",
    description: "Tự động hít chặt bằng nam châm vào mặt lưng iPhone để nạp pin an toàn và tiện lợi mà không cần dây cáp rườm rà. Kiểm soát mức pin trực tiếp ngay trên màn hình khóa và widget của iOS. Tự ngắt sạc khi pin đầy giúp duy trì sức khỏe pin iPhone bền bỉ.",
    price: 99.00,
    category: "Phụ kiện",
    images: [cdn("MT0U3")]
  },
  {
    name: "Thiết bị định vị Apple AirTag Hộp 4 chiếc",
    description: "Giải pháp theo dõi và tìm kiếm đồ đạc cá nhân thông minh nhất qua mạng lưới hàng trăm triệu thiết bị Apple của mạng Find My. Tính năng Tìm Chính Xác với chip Ultra Wideband dẫn bạn đến tận nơi chiếc chìa khóa hay balo bị thất lạc. Kháng nước kháng bụi bền bỉ với pin dùng hơn 1 năm.",
    price: 99.00,
    category: "Phụ kiện",
    images: [cdn("MX542")]
  },
  {
    name: "Ốp lưng iPhone 15 Pro Max Silicone Case MagSafe Đen",
    description: "Chất liệu silicone cao cấp mềm mại bên ngoài mang lại cảm giác cầm nắm êm ái, lớp lót sợi microfiber bên trong bảo vệ mặt kính lưng khỏi trầy xước. Tích hợp nam châm MagSafe hít chặt chuẩn xác với bộ sạc và ví da tiện lợi. Trải nghiệm phụ kiện chính hãng hoàn hảo từng đường nét.",
    price: 49.00,
    category: "Phụ kiện",
    images: [cdn("MT0U3")]
  },
  {
    name: "Ốp lưng iPhone 15 Pro FineWoven Case MagSafe Xanh Thái Bình Dương",
    description: "Chất liệu vải FineWoven độc quyền của Apple dệt từ 68% vật liệu tái chế mềm mịn như nhung mang lại vẻ đẹp thanh lịch đẳng cấp. Nam châm hít nhạy sạc không dây nhanh chóng mà không cần tháo ốp. Bảo vệ toàn diện các góc cạnh chiếc iPhone đắt giá của bạn.",
    price: 59.00,
    category: "Phụ kiện",
    images: [cdn("MT0H3")]
  }
];

// Write file
const outputPath = path.join(__dirname, 'apple_products_100.json');
fs.writeFileSync(outputPath, JSON.stringify(appleProducts100, null, 2), 'utf8');
console.log(`[DATA] Đã tạo thành công file JSON chứa ${appleProducts100.length} sản phẩm Apple tại: ${outputPath}`);

// Validate categories
const catCount = {};
appleProducts100.forEach(p => {
  catCount[p.category] = (catCount[p.category] || 0) + 1;
});
console.log('[DATA] Phân bổ theo 6 Danh mục:', catCount);
