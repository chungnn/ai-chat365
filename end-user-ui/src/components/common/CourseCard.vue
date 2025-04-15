<template>
  <v-card
    :to="{ name: 'CourseDetails', params: { id: course._id } }"
    class="course-card"
    elevation="2"
    hover
  >
    <v-img
      :src="course.thumbnail || '/assets/default-course.jpg'"
      height="200"
      class="course-thumbnail"
      gradient="to bottom, rgba(0,0,0,0) 60%, rgba(0,0,0,0.7)"
    >
      <v-card-title class="white--text course-title">
        {{ course.title }}
      </v-card-title>
    </v-img>

    <v-card-text class="pb-0">
      <p class="course-description">{{ truncateDescription(course.description) }}</p>
      <div class="d-flex align-center mt-2">
        <v-avatar size="24" class="mr-2">
          <img :src="course.instructor.avatar || '/assets/default-avatar.png'" alt="instructor">
        </v-avatar>
        <span class="caption">{{ course.instructor.name }}</span>
      </div>
    </v-card-text>

    <v-divider class="mt-2"></v-divider>
    
    <v-card-actions>
      <v-rating
        :value="course.rating"
        color="amber"
        dense
        half-increments
        readonly
        size="14"
      ></v-rating>
      <span class="caption ml-1">{{ course.rating.toFixed(1) }}</span>
      <v-spacer></v-spacer>
      <div class="d-flex flex-column align-end">
        <div v-if="course.discountPrice" class="d-flex align-center">
          <span class="text-decoration-line-through caption grey--text mr-1">{{ formatPrice(course.price) }}đ</span>
          <span class="subtitle-1 font-weight-bold">{{ formatPrice(course.discountPrice) }}đ</span>
        </div>
        <div v-else>
          <span class="subtitle-1 font-weight-bold">{{ formatPrice(course.price) }}đ</span>
        </div>
      </div>
    </v-card-actions>

    <v-btn
      color="primary"
      class="add-to-cart-btn"
      fab
      small
      absolute
      right
      bottom
      @click.stop="addToCart"
    >
      <v-icon>mdi-cart-plus</v-icon>
    </v-btn>
  </v-card>
</template>

<script>
export default {
  name: 'CourseCard',
  props: {
    course: {
      type: Object,
      required: true
    }
  },
  methods: {
    truncateDescription(text) {
      return text && text.length > 100 ? text.substring(0, 100) + '...' : text;
    },
    formatPrice(price) {
      return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    },
    addToCart() {
      this.$store.dispatch('cart/addToCart', this.course);
    }
  }
};
</script>

<style scoped>
.course-card {
  position: relative;
  transition: transform 0.3s, box-shadow 0.3s;
  height: 100%;
}

.course-card:hover {
  transform: translateY(-5px);
}

.course-thumbnail {
  position: relative;
}

.course-title {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  font-size: 18px;
  line-height: 1.3;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6);
}

.course-description {
  max-height: 60px;
  overflow: hidden;
  color: rgba(0, 0, 0, 0.7);
  font-size: 14px;
}

.add-to-cart-btn {
  transition: transform 0.2s;
}

.add-to-cart-btn:hover {
  transform: scale(1.1);
}
</style>