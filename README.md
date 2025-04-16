# Project-J2EE

## Thành viên trong nhóm
Danh sách các thành viên tham gia phát triển dự án:

- **Trần Khôi NguyênNguyên** 
- **Nguyễn Thanh Phong** 
- **Nguyễn Thanh Tú** 

## Cấu trúc dự án
Cấu trúc thư mục của dự án được tổ chức như sau:
```
Frontend/
│
├── src/                    # Thư mục chứa mã nguồn chính
│   ├── main/               # Mã nguồn chính của ứng dụng
│   │   ├── java/           # Mã nguồn Java
│   │   │   ├── controller/ # Các controller xử lý yêu cầu, gọi API và render giao diện
│   │   │   └── config/     # Cấu hình ứng dụng (RestTemplate, security, v.v.)
│   │   └── resources/      # Tài nguyên tĩnh và template
│   │       ├── templates/  # Thư mục chứa các file template (Thymeleaf, JSP, v.v.)
│   │       ├── static/     # File tĩnh (CSS, JS, hình ảnh, v.v.)
│   │       │   ├── css/    # File CSS
│   │       │   ├── js/     # File JavaScript
│   │       │   └── images/ # Hình ảnh
│   │       └── application.properties  # Cấu hình ứng dụng (port, URL backend, v.v.)
│   └── test/               # Mã nguồn cho kiểm thử
│       └── java/           # Các file test
│
├── pom.xml                 # File cấu hình Maven (quản lý dependency)
├── README.md               # File mô tả dự án (file này)
└── .gitignore              # File liệt kê các thư mục/file không đẩy lên Git
```