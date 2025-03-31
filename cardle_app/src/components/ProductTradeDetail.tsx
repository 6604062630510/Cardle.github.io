import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../database/client'; 
import { Link, useNavigate } from "react-router-dom"; 


function ProductTradeDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState<boolean>(false);
  const [offerDescription, setOfferDescription] = useState<string>('');
  const [offerTitle, setOfferTitle] = useState<string>('');
  const [offerImage, setOfferImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("currentUser");
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    } 
    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from('Posts-trade')
        .select(
          `id_post,
           created_at,
           title,
           type,
           flaw,
           hashtag_i_have,
           hashtag_i_want,
           description_i_have,
           description_i_want,
           post_img_i_have,
           post_img_i_want,
           has_flaw,
           by_userid,
           has_want,
               by_user:by_userid(acc_name, username),
    dealed_user:dealed_userid(acc_name, username)`
        )
        .eq('id_post', id)
        .single();

      if (error) {
        console.error("Error fetching posts:", error.message);
        setError(`Failed to fetch posts: ${error.message}`);
      } else {
        setProduct(data);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id, navigate]);

  const openModal = (image: string) => {
    setCurrentImage(image);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentImage(null);
  };

  if (error) {
    return <div>{error}</div>;
  }

  const openOfferModal = () => {
    if (!currentUser) {
      navigate("/signin", { state: { from: `/trade/product/${id}` } });
      return;
    }
    setIsOfferModalOpen(true);
  };


  const closeOfferModal = () => {
    setIsOfferModalOpen(false);
    setOfferDescription('');
    setOfferImage(null);
  };


  const handleOfferSubmit = async () => {
    if (!offerDescription) {
      alert("กรุณากรอกรายละเอียดข้อเสนอ");
      return;
    }
    if (!offerImage) {
      alert("กรุณาอัปโหลดรูปก่อนส่งข้อเสนอ");
      return;
    }
  

    setIsSubmitting(true);

    let imageUrl = null;


    if (offerImage) {
      const fileName = `offer_${Date.now()}_${offerImage.name}`;
      const { data, error } = await supabase.storage
        .from('Offer')
        .upload(fileName, offerImage);

      if (error) {
        console.error("Error uploading image:", error.message);
        alert("เกิดข้อผิดพลาดในการอัปโหลดรูป");
        setIsSubmitting(false);
        return;
      }

      imageUrl = `${supabase.storage.from('offer').getPublicUrl(fileName).data.publicUrl}`;
    }

    const { error: insertError } = await supabase
      .from('Offer')
      .insert([
        {

          by_userid: currentUser.id,
          description: offerDescription,
          title:offerTitle,
          pic: imageUrl,
          created_at: new Date().toISOString(),
          id_post: id,

        },
      ]);

    if (insertError) {
      console.error("Error inserting offer:", insertError.message);
      alert(`เกิดข้อผิดพลาดในการบันทึกข้อเสนอ ${insertError.message}`);
    } else {
      alert("ส่งข้อเสนอเรียบร้อยแล้ว!");
      closeOfferModal();
    }

    setIsSubmitting(false);
  };
const toggleFavorite = async (id_post: number) => {
    if (!currentUser) {
      alert("กรุณาเข้าสู่ระบบก่อนเพิ่มรายการโปรด");
      return;
    }
    let favPosts: number[] = currentUser.fav_post_trade || [];
    let action = "";
    if (favPosts.includes(id_post)) {
      favPosts = favPosts.filter(item => item !== id_post);
      action = "ลบออก";
    } else {
      favPosts.push(id_post);
      action = "เพิ่ม";
    }
    const { error } = await supabase
      .from('Users')
      .update({ fav_post_trade: favPosts })
      .eq('id', currentUser.id);

    if (error) {
      console.error("Error updating favorites:", error.message);
      alert("เกิดข้อผิดพลาดในการอัปเดตรายการโปรด");
    } else {
      alert(`${action}สินค้าในรายการโปรดเรียบร้อยแล้ว`);
      const updatedUser = { ...currentUser, fav_post_trade: favPosts };
      setCurrentUser(updatedUser);
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    }
  };

  const isFavorite = (id_post: number) => {
    if (!currentUser) return false;
    const favPosts: number[] = currentUser.fav_post_trade || [];
    return favPosts.includes(id_post);
  };



  return (
    <div className="container mt-5 bg-trade">
      {product ? (
        <div>
<div className="d-flex gap-3 align-items-stretch">
<div
  className="image-container d-flex flex-column"
  style={{ width: '50%' }}
>
  {product.post_img_i_have.length > 0 && (
    <div
      style={{
        flex: 1,
        overflow: 'hidden',
      }}
    >
      <img
        src={product.post_img_i_have[0]}
        alt={`Product Image 1`}
        className="img-fluid rounded"
        style={{
          width: '100%',
          height: '500px',
          objectFit: 'cover',
          cursor: 'pointer',
          border: '2px solid #ddd',
          borderRadius: '8px',
        }}
        onClick={() => openModal(product.post_img_i_have[0])}
      />
    </div>
  )}
</div>

  {/* คอลัมน์ข้อมูลสินค้า */}
  <div className="product-info" style={{ width: '50%' }}>
    <h2 style={{ wordWrap: 'break-word' }}>{product.title}</h2>
    <div className="d-flex flex-wrap gap-2 mt-4">
      {product.hashtag_i_have?.map((hashtag: string, index: number) => (
        <span key={index} className="badge custom-badge ">
          #{hashtag}
        </span>
      ))}
    </div>
    <div className="p-3 mt-4 mb-4 border border-dark bg-white" style={{ wordWrap: 'break-word' }}>
      <h5 className="custom-line-height about-text">{product.description_i_have}</h5>
      {product.has_flaw && (
        <div>
          <h4 className="text-danger">* ตำหนิ *</h4>
          <h5 className="custom-line-height about-text">{product.flaw}</h5>
        </div>
      )}
      
    </div>
    
    <h4>{product.by_user.acc_name} กำลังมองหา 👀</h4>
    <div className="p-3 mt-4 mb-4 border border-dark bg-white" style={{ wordWrap: 'break-word' }}>
      {product.has_want ? (
        <div>
          <h5 className="custom-line-height about-text">{product.description_i_want}</h5>

          <div className="d-flex flex-wrap gap-2">
                  {product.hashtag_i_want?.map((hashtag: string, index: number) => (
                    <span key={index} className="badge custom-badge-want">
                      #{hashtag}
                    </span>
                  ))}
                </div>
        </div>
      ) : (
        <h5>การ์ดจากทุกด้อม</h5>
      )}
    </div>
    <div className="mt-4 d-flex flex-wrap gap-2">
    <div>
  <div style={{ display: 'flex', alignItems: 'center' }}>
  <Link to={`/profile/${product.by_user.username}`} className="no-link-style">
    <h5 style={{ marginRight: '10px' }}>Posted by: {product.by_user.acc_name}</h5>
    <small className="text-muted">@{product.by_user.username}</small>
    </Link>
  </div>
  <p>Created at: {new Date(product.created_at).toLocaleString()}</p>
</div>


    <div className="ms-auto">

    <button 
      className="btn btn-fav btn-lg me-3"
      onClick={(e) => {
        e.preventDefault();
        toggleFavorite(product.id_post);
      }}
      
    >
      {currentUser && currentUser.fav_post_trade && currentUser.fav_post_trade.includes(product.id_post)
        ? <img src="/fill-fav-icon.png" alt="Remove Fav" style={{ width: '30px' }} />
        : <img src="/emt-fav-icon.png" alt="Add Fav" style={{ width: '30px' }} />}
    </button>
      <button className="btn btn-detail" onClick={openOfferModal} style={{ fontSize: '30px', padding: '10px 50px', letterSpacing: '2px' }}  >OFFER</button>
    
    
    </div>
    </div>
  </div>
</div>

<div className="mt-5">


              {product.post_img_i_have && product.post_img_i_have.length > 0 && (
                <div className="d-flex justify-content-center mt-5 mb-5" style={{ gap: '150px' }}>
                  {product.post_img_i_have.slice(1, 3).map((image: string, index: number) => (
                    <div
                      key={index}
                      className="image-container"
                      style={{
                        width: '500px',
                        height: '350px',
                        overflow: 'hidden',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        marginBottom: '10px',
                      }}
                    >
                      <img
                        src={image}
                        alt={`Wanted Image ${index + 1}`}
                        className="img-fluid rounded"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          cursor: 'pointer',
                        }}
                        onClick={() => openModal(image)}
                      />
                    </div>
                  ))}
                </div>
    )}
            </div>

          {/* ส่วนของสิ่งที่ผู้โพสต์กำลังมองหา (product.has_want) */}
          {product.has_want && (
            <div className="mt-5">

                <h4 className="ms-5">{product.by_user.acc_name} กำลังมองหา 👀</h4>

              {product.post_img_i_want && product.post_img_i_want.length > 0 && (
                <div className="d-flex justify-content-center mt-5 mb-5" style={{ gap: '150px' }}>
                  {product.post_img_i_want.slice(0, 2).map((image: string, index: number) => (
                    <div
                      key={index}
                      className="image-container"
                      style={{
                        width: '500px',
                        height: '350px',
                        overflow: 'hidden',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        marginBottom: '10px',
                      }}
                    >
                      <img
                        src={image}
                        alt={`Wanted Image ${index + 1}`}
                        className="img-fluid rounded"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          cursor: 'pointer',
                        }}
                        onClick={() => openModal(image)}
                      />
                    </div>
                  ))}
                </div>
    )}
            </div>
          )}
          

        </div>
      ) : (
        <p>Loading product details...</p>
      )}


      {isModalOpen && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-body p-0">
                  {currentImage && (
                    <img
                      src={currentImage}
                      alt="Full view"
                      style={{
                        width: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  )}
                </div>
                <div className="modal-footer">
                  <button onClick={closeModal} className="btn btn-light">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

{isOfferModalOpen && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{currentUser.acc_name} กำลังส่งข้อเสนอแลกเปลี่ยน</h5>
                  <button type="button" className="close" onClick={closeOfferModal}>×</button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Title</label>
                    <textarea
                      className="form-control mb-3"
                      value={offerTitle}
                      onChange={(e) => setOfferTitle(e.target.value)}
                      required
                    />
                    <label>รายละเอียดการ์ดของ {currentUser.acc_name}</label>
                    <textarea
                      className="form-control"
                      value={offerDescription}
                      onChange={(e) => setOfferDescription(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group mt-3">
                    <label>อัปโหลดรูป 1 รูป</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={(e) => setOfferImage(e.target.files?.[0] || null)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeOfferModal}>ยกเลิก</button>
                  <button className="btn btn-primary" onClick={handleOfferSubmit} disabled={isSubmitting}>
                    {isSubmitting ? "กำลังส่ง..." : "ส่งข้อเสนอ"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}



    </div>
  );
}
const toggleFavorite = async (id_post: number) => {
  const storedUser = localStorage.getItem("currentUser");
  if (!storedUser) {
    alert("กรุณาเข้าสู่ระบบก่อนเพิ่มรายการโปรด");
    return;
  }
  const currentUser = JSON.parse(storedUser);
  let favPosts: number[] = currentUser.fav_post_trade || [];
  let action = "";
  if (favPosts.includes(id_post)) {
    favPosts = favPosts.filter((item: number) => item !== id_post);
    action = "ลบออก";
  } else {

    favPosts.push(id_post);
    action = "เพิ่ม";
  }

  const { error } = await supabase
    .from('Users')
    .update({ fav_post_trade: favPosts })
    .eq('id', currentUser.id);

  if (error) {
    console.error("Error updating favorites:", error.message);
    alert("เกิดข้อผิดพลาดในการอัปเดตรายการโปรด");
  } else {
    alert(`${action}สินค้าในรายการโปรดเรียบร้อยแล้ว`);

    currentUser.fav_post_trade = favPosts;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    window.location.reload();
  }
};

export default ProductTradeDetail;
