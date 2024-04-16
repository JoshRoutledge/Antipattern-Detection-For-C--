class BlobClass {

    int quantity;
    int *ptr;
    Item item;
    ItemPanel itemPanel;

    int blob_foo(int a, int b){
        return a + b;
    }

    int blob_bar(int a){
        a = 15 - a;
        return a + foo(3, 4);
    }

    int blob_buz(int a){
        int b = 0;
        if (a > 5){
            return 0;
        }
        else{
            while (a > 5){
                a = a - 1;
                b = b + 1;
            }
            return b;
        }
    }

    Item blob_getItem() {
        return item
    }

    int blob_getQuantity() {
        return quantity
    }

    void blob_updateItemPanel() {
        Item item = blob_getItem();
        int q = blob_getQuantity();
        if(item == null){
            itemPanel.clear();
        } else {
            itemPanel.setItem(item);
            int inStock = Warehouse.getInstance().getQuantity(item);
            itemPanel.setInStock(inStock);
        }
    }
};

class blobUser0 {
    int blob_user_0_foo(int a, int b){
        blob_foo(a, b);
        blob_bar(a);
        return a + b;
    }

};

class blobUser1 {
    int blob_user_1_foo(int a, int b){
        blob_bar(a);
        return a + b;
    }
};

class blobUser2 {
    int blob_user_2_foo(int a, int b){
        blob_buz(a);
        return a + b;
    }
};