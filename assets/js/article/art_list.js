$(function() {
    var layer = layui.layer;
    var form = layui.form;
    var laypage = layui.laypage;
    //定义美化时间的过滤器
    template.defaults.imports.dataFormat = function(date) {
        const dt = new Date(date);


        var y = dt.getFullYear();
        var m = padZero(dt.getMonth() + 1);
        var d = padZero(dt.getDate());

        var hh = padZero(dt.getHours());
        var mm = padZero(dt.getMinutes());
        var ss = padZero(dt.getSeconds());

        return y + '-' + m + '-' + d + ' ' + hh + ':' + mm + ':' + ss
    }

    //定义补零的函数
    function padZero(n) {
        return n > 9 ? n : '0' + n;
    }

    // 定义一个查询的参数对象，将来请求数据的时候需要将请求参数对象提交到服务器
    var q = {
        pagenum: 1, //页码值，默认等于1 第一页
        pagesize: 2, //每页显示几条数据 默认等于2 显示两条数据
        cate_id: '', //文章分类的 Id
        state: '', //文章的状态
    }

    initTable();
    initCate();
    //获取文章列表数据的方法
    function initTable() {
        $.ajax({
            method: 'GET',
            url: '/my/article/list',
            data: q,
            success: function(res) {
                // console.log('ok');
                // console.log(res);
                if (res.status !== 0) {
                    return layer.msg('获取文章列表失败！')
                }
                //成功之后用模板引擎渲染数据
                var htmStr = template('tpl-table', res);
                $('tbody').html(htmStr);
                // layer.msg('获取文章列表成功！')

                //调用渲染分页的方法
                renderPage(res.total);
            }
        })
    }

    //初始化文章分类的方法
    function initCate() {
        $.ajax({
            method: 'GET',
            url: '/my/article/cates',
            success: function(res) {
                if (res.status !== 0) {
                    return layer.msg('获取文章分类列表失败！')
                }
                // 调用模板引擎的可选项
                var htmlStr = template('tpl-cate', res);
                // console.log(htmlStr);
                $('[name = cate_id]').html(htmlStr);
                form.render();
            }

        })
    }

    //1.为筛选表单绑定submit提交事件 阻止默认提交行为
    $('#form-search').on('submit', function(e) {
        e.preventDefault();
        //获取表单中选中项的值
        var cate_id = $('[name = cate_id]').val();
        var state = $('[name = state]').val();
        //为查询参数对象 q 中对应的属性赋值
        q.cate_id = cate_id;
        q.state = state;
        //根据最新的筛选条件，重新渲染表格的数据
        initTable();
    })

    //定义渲染分页的方法
    function renderPage(total) {
        // console.log(total);

        //调用 laypage.render()方法来渲染分页结构
        laypage.render({
            elem: 'pageBox', //分页容器的id
            count: total, //总数据条数
            limit: q.pagesize, //每页显示多少条数
            curr: q.pagenum, //设置指定默认选中哪一页的
            layout: ['count', 'limit', 'prev', 'page', 'next', 'skip'],
            limits: [2, 5, 10, 15, 20],
            //发生页面切换的时候，触发jump回调
            // 触发jump回调的方式有两种：
            // 1.点击页码的时候，会触发jump回调
            // 2.只要调用了layPage.render()方法就会触发jump回调

            jump: function(obj, first) {
                //可以通过first的值来判断是通过哪种方式触发的jump回调
                // 如果first的值为ture，证明是方式二触发的，否则就是方式一触发的
                //把最新的页码值，赋值到 q 这个查询参数上
                q.pagenum = obj.curr;
                //把最新的条目数，赋值到 q 这个查询参数对象的pagesize属性中
                q.pagesize = obj.limit
                    //根据最新的页码值重新渲染表格
                if (!first) {
                    initTable();
                }
            }
        });
    }

    //通过代理的形式为删除按钮绑定点击处理函数
    $('tbody').on('click', '.btn-delete', function() {
        var len = $('.btn-delete').length;
        //获取到文章的id
        var id = $(this).attr('data-id');
        //询问用户是否要删除数据
        layer.confirm('确认删除?', { icon: 3, title: '提示' }, function(index) {
            $.ajax({
                method: 'GET',
                url: '/my/article/delete/' + id,
                success: function(res) {
                    if (res.status !== 0) {
                        return layer.msg('删除失败！')
                    }
                    layer.msg('删除成功！');
                    //当删除数据完成后，需要判断当前这一页中，是否还有剩余的数据，如果没有剩余数据了则让页码值减一，再重新调用initTable()方法
                    if (len === 1) {
                        //如果len的值等于1，证明删除完毕之后，页面上就没有任何数据了
                        //页码值最小值是1
                        q.pagenum = q.pagenum === 1 ? 1 : q.pagenum - 1;
                    }
                    initTable();
                }
            })

            layer.close(index);
        });
    })
})